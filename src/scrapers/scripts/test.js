const request = require("request-promise");
const fs = require("fs");
const path = require("path");
const { findBestMatch } = require("string-similarity");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { getTeamsFromWiki, getTopScorersFromWiki, scrapeFootballWikiData } = require("./wiki");
const { keys, getSeasonYear, sleep } = require("../../utils");

const Teams = require("../../../models/Team");
const Fixtures = require("../../../models/Fixtures");
// const { GOOGLE_SEARCH_ENGINE_ID, GOOGLE_SEARCH_API_KEY } = process.env;

const main = async () => {
    const allFixtures = await Fixtures.find({ season: getSeasonYear() });
    const teams = await Teams.find();

    const matchTeamName = (teamNameToCheck) => {
        const { bestMatchIndex } = findBestMatch(
            teamNameToCheck,
            teams.map(({ longName }) => longName)
        );

        if (bestMatchIndex >= 0) {
            return teams[bestMatchIndex].id;
        } else {
            console.log("error finding match");
        }
    };

    // allFixtures.forEach((eachFixture) => {
    //     console.log(`${matchTeamName(eachFixture.home_team)} vs ${matchTeamName(eachFixture.away_team)}`);
    // });
    const result = await Fixtures.bulkWrite(
        allFixtures.map((eachFixture) => ({
            updateOne: {
                filter: { id: eachFixture.id },
                update: {
                    home_team_id: matchTeamName(eachFixture.home_team),
                    away_team_id: matchTeamName(eachFixture.away_team),
                },
                upsert: true,
            },
        }))
    );
    if (result) {
        console.log({ result });
    }
};

main();
