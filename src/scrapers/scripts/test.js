const request = require("request-promise");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
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
            return teams[bestMatchIndex]._id;
        } else {
            console.log("error finding match");
        }
    };

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
    // const data = await Fixtures.aggregate([
    //     {
    //         $lookup: [
    //             {
    //                 from: "Teams",
    //                 localField: "home_team_id",
    //                 foreignField: "id",
    //                 as: "home_team_info",
    //             },
    //             {
    //                 from: "Teams",
    //                 localField: "away_team_id",
    //                 foreignField: "id",
    //                 as: "away_team_info",
    //             },
    //         ],
    //     },
    // ]);

    // console.log({ data });

    // const allTeams = await Teams.find({});
    // const teamsWithObjectIds = allTeams.map((eachTeam) => {
    //     const teamToReturn = { ...eachTeam };
    //     teamToReturn.fixedId = mongoose.Types.ObjectId(teamToReturn.id);

    //     return eachTeam;
    // });

    // console.log({ teamsWithObjectIds: teamsWithObjectIds.slice(0, 2) });
};

main();
