const request = require("request-promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { getTeamsFromWiki, getTopScorersFromWiki, scrapeFootballWikiData } = require("./wiki");
const { keys, getSeasonYear, sleep } = require("../../utils");
const Teams = require("../../../models/Team");
// const { GOOGLE_SEARCH_ENGINE_ID, GOOGLE_SEARCH_API_KEY } = process.env;

const main = async () => {
    const teams = await Teams.find({ name: "Chelsea" });
    const teamsWithUpdatedInfo = [];

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const updatedInfo = await scrapeFootballWikiData(team.footballWikiUrl);

        if (updatedInfo.info) {
            team.info = updatedInfo.info;
        }

        teamsWithUpdatedInfo.push(team);
        await sleep(2000);
    }

    const result = await Teams.bulkWrite(
        teamsWithUpdatedInfo.map((updatedTeam) => ({
            updateOne: {
                filter: { id: updatedTeam.id },
                update: updatedTeam,
                upsert: true,
            },
        }))
    );

    console.log({ result });
};

main();
