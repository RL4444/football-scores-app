const { Schema, model } = require('../db/connection'); // import Schema & model
const moment = require('moment');

// calculate the season
const currentMonth = Number(moment().format('MM'));
let seasonShortCode = `${Number(moment().format('yyyy'))}/${Number(moment().format('yyyy')) + 1}`;
if (currentMonth < 6) {
    seasonShortCode = `${Number(moment().format('yyyy')) - 1}/${Number(moment().format('yyyy'))}`;
}

// User Schema
const StandingsSchema = new Schema({
    id: { required: true, type: String },
    competition: { required: true, type: String },
    season: { required: true, type: String, default: seasonShortCode },
    lastUpdated: { required: true, type: String, default: new Date() },
    standings: [
        {
            position: { required: true, type: String },
            teamName: { required: true, type: String },
            points: { type: String },
            form: { type: Array },
            played: { type: String },
            won: { type: String },
            drawn: { type: String },
            goalsFor: { type: String },
            goalsAgainst: { type: String },
            goalDifference: { type: String },
        },
    ],
});

// User model
const Standings = model('Standings', StandingsSchema);

module.exports = Standings;
