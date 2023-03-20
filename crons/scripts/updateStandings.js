const moment = require('moment');
const fs = require('fs');
const path = require('path');

const Standings = require('../../models/Standings');
const { getStandings } = require('../../src/scrapers/index');

const { keys, createScrapeUrl, getSeasonYear, sleep } = require('../../src/utils');

const hourlyStandingsUpdate = async () => {
    const todaysJobs = JSON.parse(fs.readFileSync(path.join(__dirname, '../jobs.json')));
    const todaysDate = moment().format('DD-MM-yyyy');

    if (todaysJobs.lastUpdated !== todaysDate || todaysJobs.jobs.length === 0) {
        console.log('No standings changes to update');
        return;
    }

    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, 'standings', moment().format('yyyy-MM'));

        try {
            const { data, error } = await getStandings(url, keys[competition].league, false);

            if (error) {
                console.log('error getting standings for ', keys[competition].league);
                throw new Error('error getting standings for ', keys[competition].league);
            }

            const result = await Standings.findOneAndUpdate(
                {
                    id: `${competition}_${getSeasonYear()}`,
                },
                {
                    competition: keys[competition].league,
                    season: getSeasonYear(),
                    lastUpdated: new Date(),
                    standings: data,
                },
                { upsert: true, useFindAndModify: false }
            );

            if (result) {
                console.log('result from standings db insert ', { result });
                console.log('standings insert result from mongo for ', keys[competition].league);
            }
        } catch (error) {
            console.log('error getting standings ', error);
        } finally {
            await sleep(2000);
        }
    });
};

module.exports = hourlyStandingsUpdate;
