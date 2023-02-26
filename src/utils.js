const moment = require('moment');

const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const sortDate = (date) => {};

const keys = {
    en: 'premier-league',
    fr: 'french-ligue-one',
    de: 'german-bundesliga',
    es: 'spanish-la-liga',
    ita: 'italian-serie-a',
    pr: 'portuguese-primeira-liga',
};

const createScrapeUrl = (competitionShortCode, job, date) => {
    // DATE = yyyy-MM format

    const jobs = {
        fixtures: 'scores-fixtures',
        standings: 'table',
    };

    if (job === 'standings') {
        return `https://www.bbc.com/sport/football/${keys[competitionShortCode]}/${jobs[job]}/`;
    }

    return `https://www.bbc.com/sport/football/${keys[competitionShortCode]}/${jobs[job]}/${date}?filter=results`;
};

const getSeasonYear = () => {
    const currentMonth = Number(moment().format('MM'));
    let seasonYear = `${Number(moment().format('yyyy'))}/${Number(moment().format('yyyy')) + 1}`;
    if (currentMonth < 6) {
        seasonYear = `${Number(moment().format('yyyy')) - 1}/${Number(moment().format('yyyy'))}`;
    }

    return seasonYear;
};

const getCompetitionShortCode = (competitionLongCode) => {
    return Object.keys(keys).find((key) => keys[key] === competitionLongCode);
};

module.exports = {
    sleep,
    sortDate,
    keys,
    getSeasonYear,
    createScrapeUrl,
    getCompetitionShortCode,
};
