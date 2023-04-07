const cron = require("node-cron");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

const { updateAllCompetitionGames } = require("./scripts/updateAll");
const updateStandings = require("./scripts/updateStandings");
const fixturesUpdate = require("./scripts/fixtureUpdate");
const populateJobsList = require("./scripts/populateJobsList");
const dailyFixturesUpdate = require("./scripts/dailyFixturesUpdate");
const updateLeagueTopScorers = require("./scripts/updateLeagueTopScorers");
const mapTeamsToFixtures = require("./scripts/mapTeamsToFixtures");

const { isLastDayOfMonth } = require("../src/utils");

const updateFixturesTeamsIds = cron.schedule("55 23 28-31 * *", async () => {
    if (isLastDayOfMonth) {
        await mapTeamsToFixtures();
    }
});

const updateTeamInfoJob = cron.schedule("50 23 */1 * *", async () => {
    await updateTeamInfoJob();
});

const topScorersUpdateJob = cron.schedule("59 23 * * *", async () => {
    await updateLeagueTopScorers();
});

const standingsUpdateJob = cron.schedule("*/10 10-23 * * *", async () => {
    await updateStandings();
});

const fixturesUpdateJob = cron.schedule("1 9 * * *", async () => {
    console.log("updating fixtures");
    await fixturesUpdate();
});

const updateAllPreviousJob = cron.schedule("20 9 1 * *", async () => {
    try {
        console.log("starting updated all -- fingers crossed");
        const result = await updateAllCompetitionGames();
        console.log({ result });
    } catch (error) {
        console.log({ error });
    } finally {
        console.log("finished updating all");
    }
});

const dailyFixturesUpdateJob = cron.schedule(`*/2 10-23 * * *`, async () => {
    console.log(`Checking jobs to scrape - Footballs coming home`);
    await dailyFixturesUpdate();
});

const populateTimetableJob = cron.schedule(`50 9 * * *`, async () => {
    console.log("Starting daily timetable populate cron");
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, "/jobs.json")));
    const todaysDate = moment().format("DD-MM-yyyy");
    // const todaysDate = '04-03-2023';

    if (todaysJobs.lastUpdated !== todaysDate) {
        await populateJobsList();
    }
});

populateTimetableJob.start();
dailyFixturesUpdateJob.start();
fixturesUpdateJob.start();
updateAllPreviousJob.start();
standingsUpdateJob.start();
topScorersUpdateJob.start();
updateTeamInfoJob.start();
updateFixturesTeamsIds.start();
