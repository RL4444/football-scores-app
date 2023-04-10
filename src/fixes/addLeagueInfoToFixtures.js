const fs = require("fs");

const Fixtures = require("../../models/Fixtures");
const Standings = require("../../models/Standings");

const main = async () => {
    const allFixtures = await Fixtures.find();
    const allStandings = await Standings.find();

    const fixedFixtures = allFixtures.map((eachFix) => {
        const fixture = eachFix;
        const standing = allStandings.find((eachStand) => eachStand.competitionShortCode === eachFix.competition_shortcode);
        fixture.competition_image = standing.image;
        fixture.competition_id = standing._id;
        return fixture;
    });

    try {
        const result = await Fixtures.bulkWrite(
            fixedFixtures.map((eachFixture) => {
                return {
                    updateOne: {
                        filter: { id: eachFixture.id },
                        update: eachFixture.toObject(),
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
    }
};

main();
