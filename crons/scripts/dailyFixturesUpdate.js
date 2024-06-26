const moment = require("moment");
const path = require("path");
const fs = require("fs");

const Fixtures = require("../../models/Fixtures");
const getFixturesAndResults = require("../../src/scrapers/getFixturesAndResults");
const { keys } = require("../../src/utils");

const populateJobsList = require("./populateJobsList");

const job = async () => {
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, "../jobs.json")));
    const todaysDate = moment().format("DD-MM-yyyy");

    if (!todaysJobs.lastUpdated || todaysJobs.lastUpdated !== todaysDate) {
        await populateJobsList();
    }

    if (!todaysJobs.jobs || todaysJobs.jobs.length === 0) {
        console.log("no jobs today -- have a break");
    }

    todaysJobs.jobs.forEach(async (job) => {
        const matchHappeningNow = moment().isAfter(job.from) && moment().isBefore(job.to);
        if (!matchHappeningNow) {
            console.log("No matches currently being played");
            return;
        }

        console.log(job.games.map((gme) => gme).join(" "), "happening -- scraping scores");
        const { data, error } = await getFixturesAndResults(job.url, true, keys[job.competition].league, false);
        if (error) {
            console.log("Error scraping during live score job: ", error);
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
        if (result) {
            console.log({ result });
            console.log(`updated scores for ${job.games.map((gme) => gme).join(" ")}`);
        }
    });
};

module.exports = job;
