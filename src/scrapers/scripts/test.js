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

const main = async (countryCode, seasonYear = getSeasonYear()) => {
    const data = await Fixtures.aggregate([
        { $match: { season: seasonYear, competition_shortcode: countryCode } },
        // { $project: { home_team_id: 1 } },
        {
            $lookup: {
                from: "teams",
                localField: "home_team_id", //this is the _id user from Teams
                foreignField: "_id", //this is the home_team__id from Fixture
                as: "home_team",
            },
        },
        {
            $lookup: {
                from: "teams",
                localField: "away_team_id", //this is the _id from Teams
                foreignField: "_id", //this is the away_team_id from Fixture
                as: "away_team",
            },
        },
        { $unwind: "$home_team" },
        { $unwind: "$away_team" },

        {
            $project: {
                id: "$id",
                competition: "$competiton",
                countryCode: "$competition_shortcode",
                homeTeam: {
                    teamId: "$home_team._id",
                    name: "$home_team.name",
                    longName: "$home_team.longName",
                    score: "$home_team_score",
                    shortCode: "$home_team.info.short_name",
                    image: "home_team.image",
                },
                awayTeam: {
                    teamId: "$away_team._id",
                    name: "$away_team.name",
                    longName: "$away_team.longName",
                    score: "$away_team_score",
                    shortCode: "$away_team.info.short_name",
                    image: "away_team.image",
                },
                shortDate: "$short_date",
                koTimestamp: "$ko_timestamp",
                ko: "$kickoff_time",
                status: "$status",
                postponed: "$postponed",
                season: "$season",
                stadium: "$stadium",
                location: "$location",
            },
        },
    ]);

    console.log({ data });

    fs.writeFileSync(`./sandbox/test-aggregation/${countryCode}.json`, JSON.stringify({ data: data }));
};

main("en");
