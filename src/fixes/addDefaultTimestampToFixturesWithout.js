const moment = require("moment");
const Fixtures = require("../../models/Fixtures");
const fs = require("fs");

const main = async () => {
    const fixturesWithTs = await Fixtures.find();
    const fixedFixtures = [];
    fixturesWithTs.forEach((eachFixture) => {
        const replaceFixture = eachFixture;
        console.log(`${eachFixture.id} with ${eachFixture.long_date}`);
        const fixedDate = moment(replaceFixture.short_date + " 12:00", "DD-MM-yyyy HH:mm")
            .utc()
            .format();
        replaceFixture.long_date = fixedDate;
        fixedFixtures.push(replaceFixture);
    });

    let curFixture = "";
    fs.writeFileSync("./sandbox/fix-time/output", JSON.stringify({ data: fixedFixtures }));
    try {
        const result = await Fixtures.bulkWrite(
            fixedFixtures.map((eachFixture) => {
                curFixture = eachFixture.id;
                return {
                    updateOne: {
                        filter: { id: eachFixture.id },
                        update: eachFixture.toObject(),
                        upsert: true,
                    },
                };
            })
        );
        console.log({ result });
    } catch (error) {
        console.log({ error });
    }
    console.log({ curFixture });
    // fs.writeFileSync("./sandbox/fix-time/output", JSON.stringify({ data: fixedFixtures }));
};

main();
