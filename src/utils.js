const moment = require("moment");

const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const sortDate = (date) => {};

const keys = {
    en: { league: "premier-league", wikiLeagueKey: "Premier_League", cup: "" },
    fr: { league: "french-ligue-one", wikiLeagueKey: "Ligue_1", cup: "" },
    de: { league: "german-bundesliga", wikiLeagueKey: "Bundesliga", cup: "" },
    es: { league: "spanish-la-liga", wikiLeagueKey: "La_Liga", cup: "" },
    ita: { league: "italian-serie-a", wikiLeagueKey: "Serie_A", cup: "" },
    pr: {
        league: "portuguese-primeira-liga",
        wikiLeagueKey: "Primeira_Liga",
        cup: "",
    },
};

// const sleep = (delay) => {
//     const start = new Date().getTime();
//     while (new Date().getTime() < start + delay);
// };

const createScrapeUrl = (competitionShortCode, job, date) => {
    // DATE = yyyy-MM format

    const jobs = {
        fixtures: "scores-fixtures",
        standings: "table",
    };

    if (job === "standings") {
        return `https://www.bbc.com/sport/football/${keys[competitionShortCode].league}/${jobs[job]}/`;
    }

    return `https://www.bbc.com/sport/football/${keys[competitionShortCode].league}/${jobs[job]}/${date}?filter=results`;
};

const getSeasonYear = () => {
    const currentMonth = Number(moment().format("MM"));
    let seasonYear = `${Number(moment().format("yyyy"))}/${
        Number(moment().format("yyyy")) + 1
    }`;
    if (currentMonth < 6) {
        seasonYear = `${Number(moment().format("yyyy")) - 1}/${Number(
            moment().format("yyyy")
        )}`;
    }

    return seasonYear;
};

const getCompetitionShortCode = (competitionLongCode) => {
    return Object.keys(keys).find((key) => {
        keys[key].league === competitionLongCode;
    });
};

module.exports = {
    sleep,
    sortDate,
    keys,
    getSeasonYear,
    createScrapeUrl,
    getCompetitionShortCode,
};
