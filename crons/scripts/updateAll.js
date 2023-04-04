const moment = require("moment");

const { Fixtures } = require("../../models/Fixtures");
const getFixturesAndResults = require("../../src/scrapers/getFixturesAndResults");
const { getSeasonYear, createScrapeUrl, keys, sleep } = require("../../src/utils");

const updateAllCompetitionGames = async (competitionId = null, minMonth = null) => {
    const seasonYearSplit = getSeasonYear().split("/");
    const thisYear = moment().format("yyyy");

    let CURRENT_TIME = moment();
    let MIN_TIME;

    // find out if how far we should go back depending on the 20xx/20xx format for league seasons
    if (minMonth) {
        if (thisYear === seasonYearSplit[0]) {
            MIN_TIME = moment(`01-${minMonth}`, "DD-MM");
        } else {
            MIN_TIME = moment(`01-${minMonth}`, "DD-MM").subtract(1, "year");
        }
    } else {
        if (thisYear === seasonYearSplit[0]) {
            MIN_TIME = moment(`01-08`, "DD-MM");
        } else {
            MIN_TIME = moment(`01-08`, "DD-MM").subtract(1, "year");
        }
    }

    while (moment(CURRENT_TIME, "").isAfter(MIN_TIME)) {
        Object.keys(keys).forEach(async (competition) => {
            const url = createScrapeUrl(competition, "fixtures", moment(CURRENT_TIME).format("yyyy-MM"));
            const { data, error } = await getFixturesAndResults(url, true, keys[competition].league, false);

            if (error) {
                console.log("error ", error);
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
                    console.log(`Successfully updated month ${CURRENT_TIME} for ${keys[competition].league}`);
                }
            }
            await sleep(3000);
        });
        CURRENT_TIME = moment(CURRENT_TIME).subtract(1, "month");
    }

    return {
        finished: true,
    };
};
module.exports = { updateAllCompetitionGames };
