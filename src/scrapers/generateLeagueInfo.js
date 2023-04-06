const fs = require("fs");
const stringSimilarity = require("string-similarity");

// const Team = require("../../models/Team");
const Standings = require("../../models/Standings");

const { generateFootballData, getTeamsFromWiki, getTopScorersFromWiki, getWikiImage } = require("./scripts/wiki");
const { getSeasonYear, sleep } = require("../utils");

async function main() {
    const competitionToUpdate = await Standings.find({ season: getSeasonYear() });

    let updatedLeagues = [];
    for (let i = 0; i < competitionToUpdate.length; i++) {
        console.log("this wikilink ", competitionToUpdate[i].wikiLink);
        const league = {
            id: competitionToUpdate[i].id,
        };

        league.topScorers = await getTopScorersFromWiki(competitionToUpdate[i].wikiLink);
        await sleep(1000);
        league.image = await getWikiImage(competitionToUpdate[i].wikiLink.replace("2022%E2%80%9323_", ""));
        await sleep(1000);
        league.lastUpdated = new Date();

        updatedLeagues.push(league);
    }

    const result = await Standings.bulkWrite(
        updatedLeagues.map((eachCompetition) => ({
            updateOne: {
                filter: { id: eachCompetition.id },
                update: eachCompetition,
                upsert: true,
            },
        }))
    );
    console.log({ result });
    return;
}

main();
