const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const { updateAllCompetitionGames } = require('./scripts/updateAll');
const hourlyStandingsUpdate = require('./scripts/hourlyStandingsUpdate');
const fixturesUpdate = require('./scripts/fixtureUpdate');
const populateJobsList = require('./scripts/populateJobsList');
const todaysFixtureUpdate = require('./scripts/todaysFixturesUpdate');

const standingsUpdateJob = cron.schedule('*/10 10-23 * * *', async () => {
    await hourlyStandingsUpdate();
});

const fixturesUpdateJob = cron.schedule('1 9 * * *', async () => {
    await fixturesUpdate();
});

const updateAllPreviousJob = cron.schedule('15 9 1 * *', async () => {
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

const todaysFixtureUpdateJob = cron.schedule(`*/2 10-23 * * *`, async () => {
    console.log(`Checking jobs to scrape - Footballs coming home`);
    await todaysFixtureUpdate();
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
todaysFixtureUpdateJob.start();
fixturesUpdateJob.start();
updateAllPreviousJob.start();
standingsUpdateJob.start();
