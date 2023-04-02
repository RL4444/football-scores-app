const { Fixtures } = require("../../../models/Fixtures");
const Standings = require("../../../models/Standings");

async function deleteBadIds() {
    const res = await Fixtures.deleteMany({
        id: { $regex: /(.*)?object?/ },
    });
    console.log({ res });

    return;
}

deleteBadIds();
