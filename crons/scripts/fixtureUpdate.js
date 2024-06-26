const moment = require("moment");

const Fixtures = require("../../models/Fixtures");
const getFixturesAndResults = require("../../src/scrapers/getFixturesAndResults");
const { keys, createScrapeUrl, sleep } = require("../../src/utils");

const { sendMail } = require("../../mailer/index");

const job = async () => {
    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, "fixtures", moment().format("yyyy-MM"));
        const { data, error } = await getFixturesAndResults(url, true, keys[competition].league, false);
        if (error) {
            console.error(`error scraping ${competition} scores in scraper`, error);
            const mailSuccess = await sendMail(
                "errorReport",
                { subject: `Error in job writing ${moment().utc()}`, from: "System" },
                { errors: [`competition ${keys[competition].league} did not update for its monthly schedule`] }
            );
            if (mailSuccess) {
                console.log("Mail success - Sent error report");
            } else {
                console.error("Sending error report failed");
            }
            return;
        }

        if (data && data.length === 0) {
            console.log(`no games for ${competition} -- not persisting to db`);
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
            console.log(`Successfully updated ${keys[competition].league} scores in scraper & db`, error);
            console.log(`updated scores for ${data.map((gme) => gme).join(" ")}`);
            const success = await sendMail(
                "monthlyScrapeReport",
                { subject: `Fixtures for ${keys[competition].league}`, from: "System" },
                {
                    fixtures: data.map((eachFixture) => {
                        return { id: eachFixture.id, date: eachFixture.short_date };
                    }),
                    competition: keys[competition].league,
                }
            );

            if (success) {
                console.log("Complete update & mail send successfully");
            } else {
                console.log(`error sending mail after attempting db insert for ${competition}`);
            }
        } else {
            const success = await sendMail(
                "errorReport",
                { subject: `Error in job writing ${moment().utc()}`, from: "System" },
                { errors: [`competition ${keys[competition].league} did not update for its monthly schedule`] }
            );

            if (success) {
                console.log("Error mail sent");
            }
        }

        sleep(1500);
    });
};

module.exports = job;
