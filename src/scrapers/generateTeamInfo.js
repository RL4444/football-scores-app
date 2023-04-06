const fs = require("fs");

const Team = require("../../models/Team");
const Standings = require("../../models/Standings");

const { generateFootballData, getTeamsFromWiki, getWikiImage } = require("./scripts/wiki");
const { sleep, getSeasonYear, getCompetitionShortCode } = require("../utils");

async function main() {
    try {
        const leagues = await Standings.find({ season: getSeasonYear() });

        const allTeams = [];
        for (let i = 0; i < leagues.length; i++) {
            const teams = await getTeamsFromWiki(leagues[i].wikiLink);
            await sleep(1000);

            for (let j = 0; j < teams.length; j++) {
                teams[j].id = `${teams[j].name.replace(/ /g, "").toLowerCase()}_${getCompetitionShortCode(
                    leagues[i].competition
                )}_${getSeasonYear()}`;
                const wikiInfo = await generateFootballData(teams[j].name);
                teams[j].image = await getWikiImage(teams[j].wikiLink);
                teams[j].country = getCompetitionShortCode(leagues[i].competition);

                if (wikiInfo) {
                    teams[j].info = wikiInfo.info || {};
                    teams[j].footballWikiUrl = wikiInfo.footballWikiUrl || "";
                    teams[j].footballWikiId = wikiInfo.footballWikiId || null;
                } else {
                    teams[j].info = {};
                    teams[j].footballWikiUrl = "";
                    teams[j].footballWikiId = null;
                }
            }

            allTeams.push(teams);
        }

        fs.writeFileSync("./sandbox/teams-test-output.json", JSON.stringify({ allTeams }));

        const result = await Team.bulkWrite(
            // array is 2D - make it 1 number so
            allTeams.flat(1).map((eachTeam) => ({
                updateOne: {
                    filter: { id: eachTeam.id },
                    update: eachTeam,
                    upsert: true,
                },
            }))
        );
        console.log({ result });
        return;
    } catch (error) {
        console.log({ error });
    }
}

// async function persistToDb() {
//     try {
//         const result = await Team.bulkWrite(
//             teamsTestOutput.allTeams.flat(1).map((eachTeam) => ({ // generated from a json dump
//                 updateOne: {
//                     filter: { id: eachTeam.id },
//                     update: eachTeam,
//                     upsert: true,
//                 },
//             }))
//         );
//         console.log({ result });
//     } catch (error) {
//         console.log({ error });
//     }
// }

// // persistToDb();
main();
