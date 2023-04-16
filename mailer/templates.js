const moment = require("moment");

// normal #0251d5;
// error red #fa125a
// success green #1bce00;

const monthlyScrapeReport = (args) => `
        <body style='font-family: sans-serif; padding-bottom: 30px;'>
            <div style='background-color: #fff; color: #000; font-size: 16px; padding: 2em 13m; display: block;'>
                <div style="padding: 25px; background-color: #1bce00;">
                        <h1 style='color: #fff;'>Todays Football Schedule ${moment().utc()}</h1>
                </div>
                <div style="padding: 25px;">
                    <h4 style='margin-top: 1em;'>Upcoming monthly fixtures for Competition ${args.competition}</h4>
                    <ul>
                    ${args.fixtures
                        .map((eachFixture, idx) => {
                            return `
                            <li key=${idx}><b>${eachFixture.id}</b> - ${eachFixture.date}</li>
                        `;
                        })
                        .join("")}
                    </ul>
                </div>
            </div>
        </body>
`;

// Takes array of errors in args : { jobs: []}
const scheduleUpdateResult = (args) => `
            <body style='font-family: sans-serif; padding-bottom: 30px;'>
                <div style='background-color: #fff; color: #000; font-size: 16px; padding: 2em 13m; display: block;'>
                    <div style="padding: 25px; background-color: #1bce00;">
                         <h1 style='color: #fff;'>Todays Football Schedule ${moment().utc()}</h1>
                    </div>
                    <div style="padding: 25px;">
                        <h4 style='margin-top: 1em;'>Upcoming today</h4>
                        ${args.jobs
                            .map((eachJob, idx) => {
                                return `
                            <div style='margin-top: 1em;'>
                            <h4>Competition ${eachJob.competition} @ ${moment(eachJob.from).format("HH:mm")} GMT+00</h4>
                                <ul>
                                ${eachJob.games.map((eachGame) => `<li key='${eachGame}'> ${eachGame}</li>`).join("")}
                                </ul>
                            </div>
                            `;
                            })
                            .join("")}
                    </div>
                </div>
            </body>
`;

// Takes array of errors in args : { errors: []}
const errorReport = (args) => `
            <body style='font-family: sans-serif; padding-bottom: 30px;'>
                <div style='background-color: #fff; color: #000; font-size: 16px; padding: 2em 13m; display: block;'>
                    <div style="padding: 25px; background-color: #fa125a;">
                        <h1 style='color:#fff;'>Error Report ${moment().utc()}</h1>
                    </div>
                    
                     <div style="padding: 25px;">
                        <h4>Logged</h4>
                        <ul>
                            ${args.errors.map((eachError, idx) => `<li key='${idx}'>${eachError}</li>`).join("")}
                        </ul>                    
                    </div>
                </div>
            </body>
`;

const testMail = (args) => `
            <body style='font-family: sans-serif; padding-bottom: 30px;'>
                <div style='background-color: #fff; color: #000; font-size: 16px; padding: 2em 13m; display: block;'>
                    <div style="padding: 25px; background-color: #0251d5;">
                        <h1 style='color: #fff;'>This is a test</h1>    
                    </div>

                    <div style="padding: 25px;">
                        <p style='margin-top: 1em; color:#000;'>
                        The time is ${moment().utc()}
                        </p>
                        
                        <p style='margin-top: 1em; color:#000;'>${args.testString}</p>
                        <ul>
                        ${args.testArray.map((item) => `<li key='${item}'>${item}</li>`).join("")}
                        </ul>

                        <p style='color: #000;'>Automated message</p>
                    </div>
                </div>
            </body>
`;

module.exports = {
    monthlyScrapeReport,
    scheduleUpdateResult,
    errorReport,
    testMail,
};
