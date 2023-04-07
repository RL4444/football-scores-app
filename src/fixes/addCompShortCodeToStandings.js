const Standings = require("../../models/Standings");
const { keys, getCompetitionShortCode } = require("../utils");

function main() {
    const countries = Object.values(keys);
    countries.forEach(async (country) => {
        const result = await Standings.findOneAndUpdate(
            {
                competition: country.league,
            },
            { competitionShortCode: getCompetitionShortCode(country.league) }
        );

        console.log({ result });
    });
}

main();
