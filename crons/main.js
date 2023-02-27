const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const { Fixtures } = require('../models/Fixtures');
const Standings = require('../models/Standings');
const { getFixturesAndResults, getStandings } = require('../src/scrapers/index');
const { createScrapeUrl, keys, sleep, getSeasonYear } = require('../src/utils');
const { updateAllCompetitionGames } = require('./updateAll');

const { sendMail } = require('../mailer/index');

const hourlyStandingsUpdate = cron.schedule('0 10-23 * * *', async () => {
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '/jobs.json')));
    const todaysDate = moment().format('DD-MM-yyyy');

    if (todaysJobs.lastUpdated !== todaysDate && todaysJobs.jobs.length === 0) {
        console.log('no standings changes to update');
        return;
    }

    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, 'standings', moment().format('yyyy-MM'));

        try {
            const { data, error } = await getStandings(url, keys[competition], false);

            if (error) {
                console.log('error getting standings for ', keys[competition]);
            } else {
                const result = await Standings.findOneAndUpdate(
                    {
                        id: `${competition}_${getSeasonYear()}`,
                    },
                    {
                        competition: keys[competition],
                        season: getSeasonYear(),
                        lastUpdated: new Date(),
                        standings: data,
                    },
                    { upsert: true, useFindAndModify: false }
                );
                if (result) {
                    console.log('result from standings db insert ', { result });
                    console.log('standings insert result from mongo for ', keys[competition]);
                }
            }
        } catch (error) {
            console.log('error getting standings ', error);
        } finally {
            await sleep(2000);
        }
    });
});

const monthlyFixtureUpdate = cron.schedule('1 9 1 * *', async () => {
    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, 'fixtures', moment().format('yyyy-MM'));
        const { data, error } = await getFixturesAndResults(url, true, keys[competition], false);
        if (error) {
            console.log(error);
            await sendMail(
                'errorReport',
                { subject: `Error in job writing ${moment().utc()}`, from: 'System' },
                { errors: [`competition ${keys[competition]} did not update for its monthly schedule`] }
            );
            return;
        }
        const result = await Fixtures.bulkWrite(
            data.map((eachFixture) => ({
                updateOne: {
                    filter: { id: eachFixture.id },
                    update: eachFixture,
                    upsert: true,
                },
            }))
        );

        if (!error && result) {
            console.log({ result });
            console.log(`updated scores for ${job.games.map((gme) => gme).join(' ')}`);
            const success = await sendMail(
                'monthlyScrapeReport',
                { subject: `Monthly fixtures for ${keys[competition]}`, from: 'System' },
                {
                    fixtures: result.data.map((eachFixture) => {
                        return { id: eachFixture.id, date: eachFixture.ko_timestamp };
                    }),
                }
            );

            if (success) {
                console.log('Mail send successfully');
            } else {
                console.log('error sending mail');
            }
        } else {
            const success = await sendMail(
                'errorReport',
                { subject: `Error in job writing ${moment().utc()}`, from: 'System' },
                { errors: [`competition ${keys[competition]} did not update for its monthly schedule`] }
            );

            if (success) {
                console.log('Error mail sent');
            }
        }
    });
});

const updateAllPreviousJob = cron.schedule('15 9 * * *', async () => {
    try {
        console.log('starting updated all -- fingers crossed');
        const result = await updateAllCompetitionGames();
        console.log({ result });
    } catch (error) {
        console.log({ error });
    } finally {
        console.log('finished updating all');
    }
});

const populateJobsList = async () => {
    const todaysDate = moment().format('DD-MM-yyyy');

    let updatedJSON = {};
    const errorsFound = [];
    try {
        const todaysGames = await Fixtures.find({ short_date: todaysDate });

        if (!todaysGames) {
            errorsFound.push('Could not retrieve from Mongodb');
            return;
        }

        const jobsUnfiltered = todaysGames.map((game) => {
            const jobDetails = {
                from: moment(game.ko_timestamp).utc(),
                to: moment(game.ko_timestamp).utc().add(2, 'hours'),
                competition: game.competition_shortcode,
                url: createScrapeUrl(game.competition_shortcode, 'fixtures', moment().format('yyyy-MM')),
                games: [],
                thisGame: game.id,
            };

            return jobDetails;
        });

        const jobsFiltered = [];

        if (jobsUnfiltered.length > 0) {
            console.log(`filtering duplicates from ${jobsUnfiltered.length} jobs `);
            jobsUnfiltered.forEach((singleJob, index) => {
                if (jobsFiltered.length > 0) {
                    const seen = jobsFiltered.some((filteredJob) => {
                        const koTimesMatch = JSON.stringify(filteredJob.from) === JSON.stringify(singleJob.from);
                        const compsMatch = filteredJob.competition === singleJob.competition;

                        if (koTimesMatch && compsMatch) {
                            return true;
                        }
                    });

                    if (!seen) {
                        singleJob.games.push(singleJob.thisGame);
                        delete singleJob.thisGame;
                        jobsFiltered.push(singleJob);
                    } else {
                        jobsFiltered.forEach((jobWhere, idx) => {
                            const koTimesMatch = JSON.stringify(jobWhere.from) === JSON.stringify(singleJob.from);
                            const compsMatch = jobWhere.competition === singleJob.competition;

                            if (koTimesMatch && compsMatch) {
                                jobWhere.games.push(singleJob.thisGame);
                            }
                        });
                    }
                } else {
                    singleJob.games.push(singleJob.thisGame);
                    delete singleJob.thisGame;
                    jobsFiltered.push(singleJob);
                }
            });
            console.log(`left ${jobsFiltered.length}`);
        }

        updatedJSON = {
            jobs: jobsFiltered,
            lastUpdated: todaysDate,
            timestamp_updated: moment().utc(),
        };

        fs.writeFileSync(path.join(__dirname, '/jobs.json'), JSON.stringify(updatedJSON));
    } catch (err) {
        errorsFound.push(err);
        console.log('error');
    } finally {
        if (errorsFound.length > 0) {
            console.log('Errors found - Sending error report');
            const success = await sendMail(
                'errorReport',
                { subject: `Error in job writing ${moment().utc()}`, from: 'System' },
                { errors: errorsFound }
            );

            if (success) {
                console.log('Mail send successfully');
            } else {
                console.log('error sending mail');
            }
        } else {
            console.log('Success! Sending todays Schedule');
            const success = await sendMail(
                'scheduleUpdateResult',
                { subject: `Schedule for ${moment().utc()}`, from: 'System' },
                {
                    jobs: updatedJSON.jobs,
                }
            );

            if (success) {
                console.log('Mail send successfully');
            } else {
                console.log('error sending mail');
            }
        }
    }
};

const fixturesUpdateJobs = cron.schedule(`*/2 10-23 * * *`, async () => {
    console.log(`Checking jobs to scrape - Footballs coming home`);
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '/jobs.json')));
    const todaysDate = moment().format('DD-MM-yyyy');

    if (todaysJobs.lastUpdated !== todaysDate) {
        await populateJobsList();
    }

    if (todaysJobs.jobs && todaysJobs.jobs.length > 0) {
        todaysJobs.jobs.forEach(async (job) => {
            const matchHappeningNow = moment().isAfter(job.from) && moment().isBefore(job.to);

            if (matchHappeningNow) {
                console.log(job.games.map((gme) => gme).join(' '), 'happening -- scraping scores');
                const { data, error } = await getFixturesAndResults(job.url, true, keys[job.competition], false);
                if (error) {
                    console.log(error);
                } else {
                    const result = await Fixtures.bulkWrite(
                        data.map((eachFixture) => ({
                            updateOne: {
                                filter: { id: eachFixture.id },
                                update: eachFixture,
                                upsert: true,
                            },
                        }))
                    );
                    if (result) {
                        console.log({ result });
                        console.log(`updated scores for ${job.games.map((gme) => gme).join(' ')}`);
                    }
                }
            } else {
                console.log('No matches currently being played');
            }
        });
    }
});

const populateTimetableJob = cron.schedule(`5 9 * * *`, async () => {
    console.log('Starting daily timetable populate cron');
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '/jobs.json')));
    const todaysDate = moment().format('DD-MM-yyyy');
    // const todaysDate = '04-03-2023';

    if (todaysJobs.lastUpdated !== todaysDate) {
        await populateJobsList();
    }
});

populateTimetableJob.start();
fixturesUpdateJobs.start();
monthlyFixtureUpdate.start();
hourlyStandingsUpdate.start();
updateAllPreviousJob.start();
