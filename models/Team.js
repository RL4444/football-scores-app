const { Schema, model } = require("../db/connection"); // import Schema & model

// Team Schema
const TeamSchema = new Schema({
    id: { required: true, type: String, unique: true },
    name: { type: String, required: true },
    longName: { type: String },
    country: { type: String, required: true },
    image: { type: String },
    wikiLink: { type: String },
    info: { type: Object },
    footballWikiUrl: { type: String },
    footballWikiId: { type: String },
});

// Team Model
const Teams = model("Teams", TeamSchema);

module.exports = Teams;
