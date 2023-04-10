const Fixtures = require("../../models/Fixtures");
const { getSeasonYear } = require("../utils");

async function main() {
    // const fixtures = await Fixtures.find();
    // const fixtureWithCorrectSeasonYear = fixtures.map((eachFix) => {
    //     return {
    //         ...eachFix,
    //         season: getSeasonYear(),
    //     };
    // });

    const result = await Fixtures.updateMany({}, { season: getSeasonYear() });
    console.log({ result });
}

module.exports = main;

// main();
