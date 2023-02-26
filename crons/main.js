const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const { Fixtures } = require('../models/Fixtures');
const { getFixturesAndResults } = require('../src/scrapers/index');
const { createScrapeUrl, keys } = require('../src/utils');

const { sendMail } = require('../mailer/index');

const monthlyFixtureJob = cron.schedule('1 2 1 * *', async () => {
    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, 'scores-fixtures', moment().format('yyyy-MM'));
        const result = await getFixturesAndResults(url, true, competition, false);
        if (!result.error) {
        }
    });
});

const fixturesUpdateJobs = cron.schedule(`*/2 * * * *`, async () => {
    console.log(`Checking jobs to scrape - Footballs coming home`);
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '/jobs.json')));
    console.log({ todaysJobs });
    if (todaysJobs.jobs && todaysJobs.jobs.length > 0) {
        todaysJobs.jobs.forEach(async (job) => {
            const matchHappeningNow = moment().isAfter(job.from) && moment().isBefore(job.to);
            console.log('match start time', moment(job.from));
            console.log('match end time ', moment(job.to));

            if (matchHappeningNow) {
                console.log(job.games.map((gme) => gme).join(' '), 'happening -- scraping scores');
                const scrapeResult = await getFixturesAndResults(job.url, true, job.competition, false);
                if (scrapeResult.error) {
                    console.log(scrapeResult.error);
                } else {
                    console.log(`updated scores for ${job.games.map((gme) => gme).join(' ')}`);
                }
            } else {
                console.log('No matches currently being played');
            }
        });
    }
});

// const populateTimetableJob = cron.schedule(`2 2 * * *`, async () => {
const populateTimetableJob = cron.schedule(`8 * * * *`, async () => {
    console.log('Starting daily timetable populate cron');
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '/jobs.json')));
    const todaysDate = moment().format('DD-MM-yyyy');
    // const todaysDate = '04-03-2023';

    let updatedJSON = {};
    const errorsFound = [];

    if (todaysJobs.lastUpdated !== todaysDate) {
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
    }
});

// mainJob.start();
// fixturesUpdateJobs.start();
populateTimetableJob.start();
fixturesUpdateJobs.start();
