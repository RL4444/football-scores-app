const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { GMAIL_NODEMAILER_EMAIL, GMAIL_NODEMAILER_PASS, SEND_TO } = process.env;
const mailTemplates = require('./templates');

async function sendMail(templateType = 'testMail', mail = { subject: 'Test Mail', from: 'Test Admin' }, mailDetails) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_NODEMAILER_EMAIL,
                pass: GMAIL_NODEMAILER_PASS,
            },
        });

        const htmlGenerator = mailTemplates[templateType];
        const html = htmlGenerator(mailDetails);

        const mailOptions = {
            from: mail.from,
            to: SEND_TO,
            subject: `${mail.subject}`,
            html: html,
            amp: `<!doctype html>
            <html ⚡4email>
              <head>
                <meta charset="utf-8">
                <style amp4email-boilerplate>body{visibility:hidden}</style>
                <script async src="https://cdn.ampproject.org/v0.js"></script>
                <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
              </head>
              ${html}
            </html>`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                resolve(false);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(true);
            }
        });
    });
}

module.exports = {
    sendMail,
};
