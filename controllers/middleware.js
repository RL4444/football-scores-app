require("dotenv").config(); // loading env variables

// const Standings = require('../models/Standings');
// const Fixtures = require('../models/Fixtures');

// CREATE CONTEXT MIDDLEWARE
const createContext = (req, res, next) => {
    // put any data you want in the object below to be accessible to all routes
    req.context = {
        models: {
            // Standings,
            // Fixtures,
        },
    };
    next();
};

module.exports = {
    // isLoggedIn,
    createContext,
};
