const moment = require('moment');
const { sendMail } = require('./index');

async function main() {
    const success = await sendMail(
        'testMail',
        { subject: `Test mail ${moment()} - please ignore` },
        { testString: 'This verifies that this takes arguments', testArray: ['foo', 'bar', 'apple', 'orange'] }
    );
    console.log({ success });
}

main();
