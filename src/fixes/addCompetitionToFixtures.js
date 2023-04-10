const Fixtures = require("../../models/Fixtures");
const fs = require("fs");
const { keys, getSeasonYear, getCompetitionShortCode } = require("../utils");

async function main() {
    const fixtures = await Fixtures.find();
    const fixedFixtures = fixtures.map((fixture) => {
        const fixedFixture = fixture;
        fixedFixture.competition = keys[fixture.competition_shortcode].league;
        return fixture;
    });

    let currentUpdate = "";
    try {
        const result = await Fixtures.bulkWrite(
            fixedFixtures.map((eachFixture) => {
                currentUpdate = eachFixture.id;
                return {
                    updateOne: {
                        filter: { id: eachFixture.id },
                        update: eachFixture,
                        upsert: true,
                    },
                };
            })
        );
        if (result) {
            console.log({ result });
        }
    } catch (error) {
        console.log({ error });
    } finally {
        console.log({ currentUpdate });
    }
}

main();
