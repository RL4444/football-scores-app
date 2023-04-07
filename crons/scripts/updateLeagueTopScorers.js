const Standings = require("../../models/Standings");
const { getTopScorersFromWiki } = require("../../src/scrapers/scripts/wiki");
const { keys } = require("../../src/utils");

const job = () => {
    Object.keys(keys).forEach(async (country) => {
        const result = await Standings.findOne({
            competitionShortCode: country,
        });

        const topScorers = await getTopScorersFromWiki(result.wikiLink);

        if (topScorers) {
            const updatedResult = await Standings.updateOne(
                {
                    competitionShortCode: country,
                },
                {
                    topScorers: topScorers,
                }
            );

            console.log("Succesfully updated ", country, " top scorers ", updatedResult.acknowledged);
        } else {
            console.log("no scorers found for ", country);
        }
    });
};

module.exports = job;
