const moment = require('moment');

const { Fixtures } = require('../../models/Fixtures');
const { getFixturesAndResults } = require('../../src/scrapers/index');
const { keys, createScrapeUrl } = require('../../src/utils');

const { sendMail } = require('../../mailer/index');

const job = async () => {
    Object.keys(keys).forEach(async (competition) => {
        const url = createScrapeUrl(competition, 'fixtures', moment().format('yyyy-MM'));
        const { data, error } = await getFixturesAndResults(url, true, keys[competition], false);
        if (error) {
            console.log(error);
            await sendMail(
                'errorReport',
                { subject: `Error in job writing ${moment().utc()}`, from: 'System' },
                { errors: [`competition ${keys[competition]} did not update for its monthly schedule`] }
            );
            return;
        }
        const result = await Fixtures.bulkWrite(
            data.map((eachFixture) => ({
                updateOne: {
                    filter: { id: eachFixture.id },
                    update: eachFixture,
                    upsert: true,
                },
            }))
        );

        if (result) {
            console.log(`updated scores for ${job.games.map((gme) => gme).join(' ')}`);
            const success = await sendMail(
                'monthlyScrapeReport',
                { subject: `Fixtures for ${keys[competition]}`, from: 'System' },
                {
                    fixtures: result.data.map((eachFixture) => {
                        return { id: eachFixture.id, date: eachFixture.ko_timestamp };
                    }),
                }
            );

            if (success) {
                console.log('Mail send successfully');
            } else {
                console.log('error sending mail');
            }
        } else {
            const success = await sendMail(
                'errorReport',
                { subject: `Error in job writing ${moment().utc()}`, from: 'System' },
                { errors: [`competition ${keys[competition]} did not update for its monthly schedule`] }
            );

            if (success) {
                console.log('Error mail sent');
            }
        }
    });
};

module.exports = job;
