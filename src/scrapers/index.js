const request = require('request-promise');
const fs = require('fs');
const cheerio = require('cheerio');
const moment = require('moment');

const { getSeasonYear, getCompetitionShortCode } = require('../utils');

async function getStandings(url, competition, createJSONLocal = false) {
    try {
        const html = await request.get(url);
        const $ = cheerio.load(html);

        const table = $('tbody');
        const standings = table
            .find('tr')
            .map((index, tableRow) => {
                if (competition === 'premier-league') {
                    return {
                        position: $(tableRow).find('td').eq(0).text(),
                        teamName: $(tableRow).find('td').eq(1).text(),
                        points: $(tableRow).find('td').eq(9).text(),
                        form: $(tableRow)
                            .find('td')
                            .eq(10)
                            .find('ul > li')
                            .map((formIndex, formItem) => $(formItem).find('div > div').text())
                            .get(),
                        played: $(tableRow).find('td').eq(2).text(),
                        won: $(tableRow).find('td').eq(3).text(),
                        lost: $(tableRow).find('td').eq(4).text(),
                        drawn: $(tableRow).find('td').eq(5).text(),
                        goalsFor: $(tableRow).find('td').eq(6).text(),
                        goalsAgainst: $(tableRow).find('td').eq(7).text(),
                        goalDifference: $(tableRow).find('td').eq(8).text(),
                    };
                } else {
                    return {
                        position: $(tableRow).find('td').eq(0).text(),
                        teamName: $(tableRow).find('td').eq(2).text(),
                        points: $(tableRow).find('td').eq(10).text(),
                        form: $(tableRow)
                            .find('td')
                            .eq(11)
                            .find('span.sp-c-team-form')
                            .map((formIndex, formItem) => $(formItem).find('span').first().text())
                            .get(),
                        played: $(tableRow).find('td').eq(3).text(),
                        won: $(tableRow).find('td').eq(4).text(),
                        won: $(tableRow).find('td').eq(5).text(),
                        drawn: $(tableRow).find('td').eq(6).text(),
                        goalsFor: $(tableRow).find('td').eq(7).text(),
                        goalsAgainst: $(tableRow).find('td').eq(8).text(),
                        goalDifference: $(tableRow).find('td').eq(9).text(),
                    };
                }
            })
            .get();
        if (createJSONLocal) {
            const outputJsonData = { data: standings };
            const filePath = `${competition}.json`;
            fs.writeFileSync('./json_output/standings/' + filePath, JSON.stringify(outputJsonData));
        }
        return { data: standings, error: false };
    } catch (error) {
        return { data: null, error: true, message: error };
    }
}

async function getFixturesAndResults(url, hidePostponed = true, competition, createJSONLocal = false) {
    try {
        console.log({ url });
        const html = await request.get(url);
        const $ = cheerio.load(html);

        const POSTPONED_FIXTURES = [];

        // month and year from url
        const sortedMonthYear = url
            // +17 -> 'scores-fixtures' char length
            .substring(url.indexOf('/scores-fixtures/') + 17, url.indexOf('?'))
            .split('-')
            .reverse()
            .join('-');

        // bbc "qa-match-block" per fixture
        const fixtures = $('div.qa-match-block')
            .map((index, block) => {
                // find blocks of fixtures by day
                let blockDate = $(block).find('h3').text();
                if (!blockDate) {
                    blockDate = moment().format('DD');
                }

                const eachFixture = $(block)
                    .find('ul > li')
                    .map((idx, row) => {
                        // find each fixture that day
                        let day = blockDate.match(/\d+/).join('');
                        if (day && Number(day) < 10) {
                            day = `0` + blockDate.match(/\d+/).join('');
                        }

                        const koTimestamp = $(row).find('span.sp-c-fixture__block').text();
                        // timestamp regex matcher so we can check and add to ko_timestamp
                        const isTimestamp = /^([01]\d|2[0-3]):?([0-5]\d)$/.test(koTimestamp);

                        const shortDate = day + '-' + sortedMonthYear;
                        console.log('fixture ', $(row).text());
                        const fixture = {
                            id: `${$(row)
                                .find('.sp-c-fixture__team-name-wrap')
                                .first()
                                .find('span')
                                .text()
                                .replaceAll(' ', '')
                                .toLowerCase()}_${$(row)
                                .find('.sp-c-fixture__team-name-wrap')
                                .last()
                                .find('span')
                                .text()
                                .replaceAll(' ', '')
                                .toLowerCase()}_${competition}`,
                            competition: competition,
                            competition_shortcode: getCompetitionShortCode(competition),
                            season: getSeasonYear(),
                            home_team: $(row).find('.sp-c-fixture__team-name-wrap').first().find('span').text(),
                            away_team: $(row).find('.sp-c-fixture__team-name-wrap').last().find('span').text(),
                            home_team_score: $(row).find('.sp-c-fixture__number--home').text() || null,
                            away_team_score: $(row).find('.sp-c-fixture__number--away').text() || null,
                            long_date: blockDate,
                            short_date: shortDate,
                            last_updated: moment.utc(),
                            // defaults
                            // ko_timestamp: moment(shortDate + ' 15:00', 'DD-MM-yyyy HH:mm').format(),
                            status: $(row).find('span.sp-c-fixture__status').text(),
                            postponed: $(row)
                                .find('span.sp-c-fixture__status')
                                .text()
                                ?.toLowerCase()
                                .includes('postponed')
                                ? true
                                : false,
                        };

                        if (!fixture.home_team_score && !fixture.away_team_score && !fixture.postponed) {
                            fixture.status === 'TBP'; // to be played
                        }

                        // if fixture date > date now() this is a future fixture
                        if (koTimestamp && isTimestamp) {
                            fixture.kickoff_time = $(row).find('span.sp-c-fixture__number--time').text();

                            fixture.ko_timestamp = moment
                                .utc(fixture.short_date + ' ' + koTimestamp, 'DD-MM-yyyy HH:mm')
                                .format();
                        }

                        // create list of postponed fixtures
                        if (fixture.postponed) {
                            POSTPONED_FIXTURES.push(fixture);
                        }

                        if (hidePostponed && fixture.postponed) {
                            return;
                        }

                        // console.log({ fixture });

                        return { ...fixture };
                    })
                    .get();

                return eachFixture;
            })
            .get();

        if (createJSONLocal) {
            const outputJsonData = { data: fixtures };
            const filePath = `${competition}_${sortedMonthYear}.json`;
            fs.writeFileSync('./json_output/fixtures-results/' + filePath, JSON.stringify(outputJsonData));
        }

        return {
            data: fixtures,
            error: false,
            message: null,
        };
    } catch (error) {
        console.log('error scraping');
        console.log({ error });

        return {
            data: null,
            error: true,
            message: `error scraping ${url}: ${error}`,
        };
    }
}

module.exports = {
    getStandings,
    getFixturesAndResults,
};

// getStandings('https://www.bbc.com/sport/football/german-bundesliga/table', 'bundesliga_1');

// getFixturesAndResults(
//     'https://www.bbc.com/sport/football/premier-league/scores-fixtures/2022-09?filter=results',
//     false,
//     'premier_league'
// );
// getFixturesAndResults(
//     'https://www.bbc.com/sport/football/premier-league/scores-fixtures/2023-02?filter=results',
//     false,
//     'premier_league',
//     true
// );
// getFixturesAndResults(
//     'https://www.bbc.com/sport/football/german-bundesliga/scores-fixtures/2022-11?filter=results',
//     false,
//     'bundesliga'
// );
// getFixturesAndResults(
//     'https://www.bbc.com/sport/football/spanish-la-liga/scores-fixtures/2023-01?filter=results',
//     false,
//     'la_liga'
// );
// // 58295876;
