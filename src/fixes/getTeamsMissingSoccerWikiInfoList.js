const fs = require("fs");
const stringSimilarity = require("string-similarity");

const Teams = require("../../models/Team");

const { getBestGoogleMatch } = require("../scrapers/scripts/google");
const { scrapeFootballWikiData } = require("../scrapers/scripts/wiki");

async function main() {
    const fixedTeams = [];
    const failedMatches = [];

    const teamsWithMissingInfo = await Teams.find({ info: {} });
    if (!teamsWithMissingInfo || !teamsWithMissingInfo.length) {
        console.log("Found no missing data for teams in db");
        return;
    }

    console.log(`found ${teamsWithMissingInfo} teams with missing info `, teamsWithMissingInfo);

    for (let i = 0; i < teamsWithMissingInfo.length; i++) {
        const googleSearch = await getBestGoogleMatch(` en.soccerwiki.org teams ${teamsWithMissingInfo[i].name}`);

        const bestMatch = {
            original: teamsWithMissingInfo[i].name,
            accuracy: 0,
            url: "",
            stringTested: "",
            success: false,
        };

        if (!googleSearch || !googleSearch.items) {
            console.log("google returned nothing");
        }

        const searchResults = googleSearch.items;

        for (let j = 0; j < searchResults.length; j++) {
            if (searchResults[j].link.includes("https://en.soccerwiki.org/squad.php?")) {
                const stringToTest = searchResults[j].title.slice(0, searchResults[j].title.toLowerCase().indexOf("football club"));

                console.log(
                    "string similarity for ",
                    teamsWithMissingInfo[i].name,
                    " and ",
                    stringToTest,
                    " is ",
                    stringSimilarity.compareTwoStrings(teamsWithMissingInfo[i].name, stringToTest)
                );

                const accuracy = stringSimilarity.compareTwoStrings(teamsWithMissingInfo[i].name, stringToTest);

                if (accuracy > bestMatch.accuracy) {
                    // replace current best match
                    bestMatch.accuracy = accuracy;
                    bestMatch.url = searchResults[j].formattedUrl;
                    bestMatch.stringTested = stringToTest;
                    bestMatch.success = true;
                }
            }
        }

        console.log({ bestMatch });

        if (bestMatch.success) {
            const teamUpdated = {
                id: teamsWithMissingInfo[i].id,
            };

            const wikiData = await scrapeFootballWikiData(bestMatch.url);
            if (wikiData) {
                teamUpdated.info = wikiData.info;
                teamUpdated.footballWikiUrl = wikiData.footballWikiUrl;
                teamUpdated.footballWikiId = wikiData.footballWikiId;
            }

            fixedTeams.push(teamUpdated);
        } else {
            console.log(`failed to find good google search match for ${bestMatch.original} -- do manually`);
            failedMatches.push(bestMatch.original);
        }
    }

    if (fixedTeams.length > 0) {
        console.log("updating teams ", fixedTeams);
        const result = await Teams.bulkWrite(
            fixedTeams.map((eachTeam) => ({
                // generated from a json dump
                updateOne: {
                    filter: { id: eachTeam.id },
                    update: eachTeam,
                    upsert: true,
                },
            }))
        );
        console.log({ result });
    }

    console.log(
        "faled for ",
        failedMatches.map((team) => {
            return { name: team };
        })
    );
}

module.exports = main;

// main();
