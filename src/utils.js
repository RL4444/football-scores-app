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
    let seasonYear = `${Number(moment().format("yyyy"))}/${Number(moment().format("yyyy")) + 1}`;
    if (currentMonth < 6) {
        seasonYear = `${Number(moment().format("yyyy")) - 1}/${Number(moment().format("yyyy"))}`;
    }

    return seasonYear;
};

const getCompetitionShortCode = (competitionLongCode) => {
    return Object.keys(keys).find((key) => {
        if (keys[key].league === competitionLongCode) return true;
        else return false;
    });
};

const generateRandomUserAgentHeader = () => {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
    ];
    const randomNumber = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomNumber];
};

const isLastDayOfMonth = () => {
    const currentDay = moment().format("YYYY-MM-DD");
    const lastDayOfCurrentMonth = moment(date).endOf("month").format("YYYY-MM-DD");

    if (currentDay === lastDayOfCurrentMonth) {
        return true;
    } else {
        return false;
    }
};

module.exports = {
    createScrapeUrl,
    getSeasonYear,
    getCompetitionShortCode,
    generateRandomUserAgentHeader,
    isLastDayOfMonth,
    keys,
    sleep,
    sortDate,
};
