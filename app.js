require("dotenv").config(); // load .env variables
const express = require("express");
const app = express();
const morgan = require("morgan"); //import morgan
const cors = require("cors"); // import cors
const moment = require("moment");

const { createContext } = require("./controllers/middleware");
const scrapers = require("./routes/scrapers");

console.log("Server current time in UTC ", moment().utc());
console.log("Server current local offset ", moment().utcOffset());

const { APP_STATUS } = process.env;
const PORT = process.env.PORT || 8080;

require("./crons/main");

// GLOBAL MIDDLEWARE
app.use(cors()); // add cors headers
app.use(morgan("tiny")); // log the request for debugging
app.use(express.json()); // parse json bodies
app.use(createContext); // create req.context

app.use("/scrape", scrapers);

app.get("/test", (req, res) => {
    console.log("ping");
    res.status(200).json({
        error: false,
        message: "Healthy app - phew",
        serverTime: moment().utc(),
        serverTimeOffset: moment().utcOffset(),
        status: 200,
    });
});

if (APP_STATUS === "active") {
    app.listen(PORT, () => {
        console.log(`listening on ${PORT}`);
    });
} else {
    console.log("APP INACTIVE -- SERVER NOT RUNNING");
}
