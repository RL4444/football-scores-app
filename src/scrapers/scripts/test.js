const request = require("request-promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { getTeamsFromWiki } = require("./wiki");
const { keys, getSeasonYear, sleep } = require("../../utils");
const Teams = require("../../../models/Team");
const { GOOGLE_SEARCH_ENGINE_ID, GOOGLE_SEARCH_API_KEY } = process.env;

const main = async () => {
    const premTeams = await Teams.find({ country: "en" });

    fs.writeFileSync("./sandbox/prem-teams.json", JSON.stringify(premTeams));
};

main();
