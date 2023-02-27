const moment = require('moment');
const fs = require('fs');
const path = require('path');

const { Fixtures } = require('../../models/Fixtures');
const { createScrapeUrl } = require('../../src/utils');
const { sendMail } = require('../../mailer/index');

const job = async () => {
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

        fs.writeFileSync(path.join(__dirname, '../jobs.json'), JSON.stringify(updatedJSON));
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

module.exports = job;
