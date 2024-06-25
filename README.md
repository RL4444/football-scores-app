# FOOTBALL SCORES SCRAPER APP #

## Built with node, express, nodemailer, mongoose, node-cron and more ##

Scraper app that uses url inputs to create a dynamic time and daily job updater and live scores scraper, and historical football scores. 

Every night a script will determine the next 24hours of jobs that need to be done. (node-cron, mongoose, express, node).
The data is scraped in a raw dump and filtered into sets for next step. (cheerio, node, requestpromise, mongoose).
Standardizing the data involves unifying the various sources into matchable entities and persisting to the relevant Mongoose DBs (node, string-similarity)

run the routes in `./routes/scrapers.js` to populate the database and see the app in action. 

## To run the app correctly you will need the following ##

GMAIL or other providers mail system that is configured to work with nodemailer 
walkthrough here - https://medium.com/%40y.mehnati_49486/how-to-send-an-email-from-your-gmail-account-with-nodemailer-837bf09a7628

A mongo collection URI 
walkthrough here - https://www.mongodb.com/docs/guides/atlas/connection-string/

Google Search API key for their search services (optional)
Walkthrough here - https://support.google.com/googleapi/answer/6158862%3Fhl%3Den&ved=2ahUKEwiyxZrYh--GAxUPQ_EDHVcgBJ8QFnoECBMQAQ

The app will only take links from the BBC football fixtures and results pages (look at the scraper files to see the urls exactly), but it could need tweaking if the BBC have recently changed their HTML layouts. 

## To Start getting scores immediately ##
Go the project root and run `npm install`
Add .env vars listed in previous section
go to localhost 8080 and run in Postman / Insomnia 
`https;//localhost:8080/scrape/update-fixture-data/:competitionShortCode/:yearMonth` where competition is one of the `keys` found here `./src/utils.js` and year month in `YYYY-MM` format e.g. (2004-12)

Feel free to fork it and build on it in whatever way. Plenty of optimisation room :)




