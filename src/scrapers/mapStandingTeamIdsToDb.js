const stringSimilarity = require("string-similarity");

const Team = require("../../models/Team");
const Standings = require("../../models/Standings");

const { getSeasonYear, getCompetitionShortCode } = require("../utils");

async function matchIds(countryStandings, countryLeagueLongName) {
    const teamsFromDbModel = await Team.find({ country: getCompetitionShortCode(countryLeagueLongName) });
    const teamsListNames = teamsFromDbModel.map((dbTeam) => dbTeam.longName);

    const standingsWithIds = countryStandings.map((standingsTeam) => {
        const nameToMatch = standingsTeam.teamName;
        const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(nameToMatch, teamsListNames);
        const matchedId = teamsFromDbModel[bestMatchIndex]._id;

        if (bestMatch.rating < 1) {
            console.log(`${nameToMatch} -> ${bestMatch.target} with id ${matchedId} as ${bestMatch.rating}`);
        }

        const objectToReturn = standingsTeam;
        objectToReturn.teamId = matchedId;
        return objectToReturn;
    });

    const result = await Standings.findOneAndUpdate(
        { id: `${getCompetitionShortCode(countryLeagueLongName)}_${getSeasonYear()}` },
        {
            standings: standingsWithIds,
        },
        { upsert: true, useFindAndModify: false }
    );
    console.log(`mapped ids for teams in ${countryLeagueLongName}`);
}

async function main() {
    try {
        const leagues = await Standings.find({ season: getSeasonYear() });

        // create lists of teams from Standings and Teams and compare
        for (let i = 0; i < leagues.length; i++) {
            await matchIds(leagues[i].standings, leagues[i].competition);
        }
    } catch (error) {
        console.log({ error });
    }
}

main();

module.exports = {
    main,
    matchIds,
};
