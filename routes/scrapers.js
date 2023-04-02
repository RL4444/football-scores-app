const { Router } = require("express"); // import Router from express
const router = Router();

const Standings = require("../models/Standings");
const { Fixtures } = require("../models/Fixtures");
const scraper = require("../src/scrapers/index");
const { createScrapeUrl, keys: competitionNameKeys, getSeasonYear } = require("../src/utils");

router.get("/health/", async (req, res) => {
    res.send({
        status: 200,
        message: "group working",
    });
});

router.get("/check-standings/:competitionShortCode/", async (req, res) => {
    const { competitionShortCode } = req.params;

    const url = createScrapeUrl(competitionShortCode, "standings", null);
    const { data, error = null } = await scraper.getStandings(url, competitionNameKeys[competitionShortCode].league, true);

    if (error) {
        res.status(500).json({
            message: `scraping failed for ${url}`,
        });
        return;
    }

    try {
        const result = await Standings.findOneAndUpdate(
            {
                id: `${competitionShortCode}_${getSeasonYear()}`,
            },
            {
                competition: competitionNameKeys[competitionShortCode].league,
                season: getSeasonYear(),
                lastUpdated: new Date(),
                standings: data,
            },
            { upsert: true, useFindAndModify: false }
        );

        if (result) {
            res.status(200).json({
                status: 200,
                error: false,
                message: `updated standings for ${competitionNameKeys[competitionShortCode].league} successfully`,
                data: null,
            });
        }
    } catch (err) {
        res.status(400).json({
            error: true,
            message: err,
            data: null,
            status: 400,
        });
    }
});

router.get("/todays-jobs/", (req, res) => {
    const jobs = require("../crons/jobs.json");

    if (jobs.jobs && jobs.jobs.length > 0) {
        res.status(200).json({
            error: false,
            success: true,
            status: 200,
            data: jobs,
        });
    } else {
        res.status(404).json({
            error: false,
            success: true,
            status: 200,
            data: jobs,
        });
    }
});

router.get("/update-fixture-data/:competitionShortCode/:yearMonth", async (req, res) => {
    const { competitionShortCode, yearMonth } = req.params; // yearMonth YYYY-mm format
    const url = createScrapeUrl(competitionShortCode, "fixtures", yearMonth);
    try {
        const { data, error, message } = await scraper.getFixturesAndResults(
            url,
            true,
            competitionNameKeys[competitionShortCode].league,
            false
        );

        if (!error) {
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
                res.status(200).json({
                    status: 200,
                    error: false,
                    message: `updated fixtures for ${competitionNameKeys[competitionShortCode].league} successfully`,
                    data: null,
                });
            }
        } else {
            res.status(400).json({
                error: true,
                message: message,
                data: null,
                status: 400,
            });
        }
    } catch (err) {
        res.status(400).json({
            error: true,
            message: err,
            data: null,
            status: 400,
        });
    }
});

module.exports = router;
