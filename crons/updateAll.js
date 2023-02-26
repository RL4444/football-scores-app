const { getFixturesAndResults } = require('../src/scrapers/index');
const { getSeasonYear, createScrapeUrl } = require('../src/utils');

const updateAllCompetitionGames = async (competitionId) => {
    //en || fr || de ...
    const totalFixturesUpdated = [];
    const seasonYearSplit = getSeasonYear().split('/');

    let CURRENT_MONTH = 7;

    const competitionMonthlyData = async () => {
        const currentDate = `${CURRENT_MONTH < 7 ? seasonYearSplit[1] : seasonYearSplit[0]}-${CURRENT_MONTH}`;
        const url = createScrapeUrl(competitionId, 'fixtures', currentDate);
        const { data, error } = await getFixturesAndResults(url, true, competitionId, false);

        if (!error) {
            totalFixturesUpdated.push(data);
        } else {
            console.log('error scraping ', url);
        }
    };

    if (CURRENT_MONTH === 6) {
        return totalFixturesUpdated;
    } else {
        if (CURRENT_MONTH === 12) {
            CURRENT_MONTH = 0;
        } else {
            CURRENT_MONTH++;
        }
        await competitionMonthlyData();
    }
};

module.exports = { updateAllCompetitionGames };
