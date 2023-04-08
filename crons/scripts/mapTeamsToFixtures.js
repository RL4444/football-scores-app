const { findBestMatch } = require("string-similarity");
const Fixtures = require("../../models/Fixtures");
const Teams = require("../../models/Team");

const job = async () => {
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
};

module.exports = job;
