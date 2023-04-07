const Teams = require("../../models/Team");
const { scrapeFootballWikiData } = require("../../src/scrapers/scripts/wiki");
const { sleep } = require("../../src/utils");

const job = async () => {
    const teams = await Teams.find();
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

module.exports = job;
