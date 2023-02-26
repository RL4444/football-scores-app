const { Schema, model } = require('../db/connection'); // import Schema & model

// User Schema
const FixtureSchema = new Schema({
    id: { required: true, type: String },
    competition: { required: true, type: String },
    competition_shortcode: { type: String, required: true },
    home_team: { type: String, required: true },
    away_team: { type: String, required: true },
    home_team_score: { type: String },
    away_team_score: { type: String },
    long_date: { type: String, required: true },
    last_updated: { type: Date, required: true, default: new Date() },
    short_date: { type: String, required: true },
    ko_timestamp: { type: Date, required: false },
    status: { type: String, required: true },
    postponed: { type: Boolean, required: true, default: false },
});

// User model
const Fixtures = model('Fixture', FixtureSchema);

module.exports = { Fixtures };
