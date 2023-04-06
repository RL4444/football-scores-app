const stringSimilarity = require("string-similarity");

const Team = require("../../models/Team");
const Standings = require("../../models/Standings");

const { getSeasonYear, getCompetitionShortCode } = require("../utils");

async function main() {
    try {
        const leagues = await Standings.find({ season: getSeasonYear() });

        // create lists of teams from Standings and Teams and compare
        for (let i = 0; i < leagues.length; i++) {
            const teamsFromDbModel = await Team.find({ country: getCompetitionShortCode(leagues[i].competition) });
            const teamsListNames = teamsFromDbModel.map((dbTeam) => dbTeam.longName);

            const standingsWithIds = leagues[i].standings.map((standingsTeam) => {
                const nameToMatch = standingsTeam.teamName;
                const bestMatch = stringSimilarity.findBestMatch(nameToMatch, teamsListNames);
                const matchedId = teamsFromDbModel[bestMatch.bestMatchIndex].id;

                if (bestMatch.bestMatch.rating < 1) {
                    console.log(`${nameToMatch} -> ${bestMatch.bestMatch.target} with id ${matchedId} as ${bestMatch.bestMatch.rating}`);
                }

                const objectToReturn = standingsTeam;
                objectToReturn.teamId = matchedId;
                return objectToReturn;
            });

            const result = await Standings.findOneAndUpdate(
                { id: `${getCompetitionShortCode(leagues[i].competition)}_${getSeasonYear()}` },
                {
                    standings: standingsWithIds,
                },
                { upsert: true, useFindAndModify: false }
            );
            console.log(`mapped ids for teams in ${leagues[i].competition}`);
        }
    } catch (error) {
        console.log({ error });
    }
}

modules.exports = main;
