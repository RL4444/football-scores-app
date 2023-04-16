const { Schema, model } = require("../db/connection.js"); // import Schema & model

// Team Schema
const UserSchema = new Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    dailyLimit: { type: Number, required: true, default: 100 },
    apiKey: { type: String, required: true, default: "changeme" },
    url1: { type: String, required: true, default: "changeme" },
    url2: { type: String, required: false },
    isSuperUser: { type: Boolean, required: true, default: false },
    passwordResetToken: { type: String, required: false, default: null },
    needsPasswordReset: { type: String, required: true, default: false },
    confirmEmailToken: { type: String, required: true, default: null },
    needsEmailConfirm: { type: Boolean, required: true, default: false },
});

// Team Model
const Users = model("Users", UserSchema);

module.exports = Users;
