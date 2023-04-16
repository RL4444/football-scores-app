const User = require("../../models/User");

const job = async () => {
    const updatedUsers = await User.updateMany({ isSuperUser: false }, { dailyLimit: 100 });
    console.log({ updatedUsers });
};

module.exports = job;
