const { Schema, model } = require("../db/connection"); // import Schema & model
const { getSeasonYear } = require("../src/utils");

// User Schema
const FixtureSchema = new Schema({
    id: { required: true, type: String },
    competition: { required: true, type: String },
    competition_shortcode: { type: String, required: true },
    competition_id: Schema.Types.ObjectId,
    competition_image: { type: String },
    home_team: { type: String, required: true },
    home_team_score: { type: String },
    home_team_id: Schema.Types.ObjectId,
    away_team: { type: String, required: true },
    away_team_score: { type: String },
    away_team_id: Schema.Types.ObjectId,
    stadium: { type: String },
    location: { type: String },
    short_date: { type: String, required: true },
    long_date: { type: Date, required: true },
    last_updated: { type: Date, required: true, default: new Date() },
    ko_timestamp: { type: Date, required: false },
    kickoff_time: { type: String, required: false },
    status: { type: String, required: true },
    postponed: { type: Boolean, required: true, default: false },
    season: { type: String, required: true, default: getSeasonYear() },
});

// User model
const Fixtures = model("Fixture", FixtureSchema);

module.exports = Fixtures;
