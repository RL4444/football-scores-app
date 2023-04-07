const fs = require("fs");
const cheerio = require("cheerio");
const unirest = require("unirest");
const { sleep, generateRandomUserAgentHeader } = require("../../utils");

// img for team
// #mw-content-text > div.mw-parser-output > table.infobox.vcard > tbody > tr:nth-child(1) > td > a > img

// https://en.soccerwiki.org/squad.php?clubid=140
//
// #clubsearchresults > div.table-custom-responsive
const scrapeFootballWikiData = async (url) => {
    console.log("scraping football wiki ", url);
    try {
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });
        const $ = cheerio.load(response.body);

        const info = $("div.player-info-main")
            .find("p")
            .map((idx, el) => {
                const returnObject = {};
                const key = $(el).text().split(":")[0].trim().toLowerCase().replace(" ", "_");
                const value = $(el).text().split(":")[1] ? $(el).text().split(":")[1].trim() : "";

                returnObject[key] = value;
                return returnObject;
            })
            .get();

        const formattedObjectRaw = {};
        info.forEach((item) => {
            // removing the stadium size from the stadium title and adding as its own keypair
            if (item.stadium) {
                if (item.stadium.indexOf("(") > -1 && item.stadium.indexOf(")") > -1) {
                    formattedObjectRaw.stadium_capacity = item.stadium.substring(
                        item.stadium.indexOf("(") + 1,
                        item.stadium.lastIndexOf(")")
                    );
                    item.stadium = item.stadium.slice(0, item.stadium.indexOf("(")).trim();
                }
            }

            formattedObjectRaw[Object.keys(item)[0]] = Object.values(item)[0];
        });

        // double check no keypairs with empty values return
        const formattedObject = {};
        Object.keys(formattedObjectRaw).forEach((keyPair) => {
            if (formattedObjectRaw[keyPair].trim()) {
                formattedObject[keyPair] = formattedObjectRaw[keyPair];
            }
        });

        return {
            info: formattedObject,
            footballWikiId: url.substring(url.indexOf("clubid=") + 7, url.length),
            footballWikiUrl: url,
        };
    } catch (error) {
        console.log({ error });
        return null;
    }
};

const getFootballWikiTopResultLink = async (queryString = "Dortmund") => {
    const url = `https://en.soccerwiki.org/search.php?q=${queryString.toLowerCase()}`;
    const response = await unirest.get(url).headers({
        "User-Agent": generateRandomUserAgentHeader(),
        "Accept-Language": "en-EN",
    });

    const $ = cheerio.load(response.body);
    const topResult = $("#clubsearchresults > div").children().find("tbody").children().first().find("td:nth-child(3) > a").attr("href");

    console.log({ topResult });
    if (!topResult) {
        return "failed";
    }
    return `https://en.soccerwiki.org${topResult}`;
};

const getWikiImage = async (url) => {
    console.log({ url });
    const response = await unirest.get(url).headers({
        "User-Agent": generateRandomUserAgentHeader(),
        "Accept-Language": "en-EN",
    });

    const $ = cheerio.load(response.body);
    const mainImage = $("#mw-content-text").find("table").find("img").attr("src");

    // #content-collapsible-block-6 > h3:nth-child(1)
    // const firstTeamSquadSectionWrapper = $("#mw-content-text > div:nth-child(1)")
    //     .children()
    //     .filter((sectionIdx, sectionEl) => {
    //         console.log("yurt ", $(sectionEl).text());
    //         if ($(sectionEl).text().toLowerCase().startsWith("first-team squad")) {
    //             console.log("I FOUND IT");
    //             return true;
    //         }
    //     });

    // console.log("what this ", firstTeamSquadSectionWrapper.text());
    // console.log({ mainImage: `https:${mainImage}` });
    console.log(`https:${mainImage}`);
    if (mainImage) {
        return `https:${mainImage}`;
    } else {
        return "";
    }
};

const getTopScorersFromWiki = async (url) => {
    try {
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });

        const $ = cheerio.load(response.body);
        let statsElemId = "#Season_statistics";
        console.log("test cheerio loading", $(statsElemId).text());

        if (!$(statsElemId).text()) {
            statsElemId = "#Statistics";
        }

        const topScorersTable = $(statsElemId)
            .parent("h2")
            .nextUntil("table")
            .next()
            .find("tbody > tr")
            .map((idx, elem) => {
                const player = {};
                if (Number($(elem).find("td:nth-child(1)").text().trim())) {
                    console.log("has a rank and name ", $(elem).find("td:nth-child(2)").text());
                    player.name = $(elem).find("td:nth-child(2)").text().replace("\n", "").trim();
                    player.club = $(elem).find("td:nth-child(3)").text().replace("\n", "");
                    player.goals = $(elem).find("td:nth-child(4)").text().replace("\n", "");
                } else {
                    console.log("should be the name ", $(elem).find("td:nth-child(1)").text().replace("\n", ""));
                    player.name = $(elem).find("td:nth-child(1)").text().replace("\n", "").trim();
                    player.club = $(elem).find("td:nth-child(2)").text().replace("\n", "");
                    player.goals = $(elem).prev().find("td:nth-child(4)").text().replace("\n", "");
                }

                if (player.name) {
                    return player;
                }
            })
            .get();
        let currentGoal = 0;
        const topScorersTableWithCorrectGoals = topScorersTable.map((player) => {
            if (player.goals) {
                currentGoal = player.goals;
            } else {
                player.goals = currentGoal;
            }

            return player;
        });

        if (topScorersTableWithCorrectGoals.length) {
            return topScorersTableWithCorrectGoals;
        } else {
            return [];
        }
    } catch (error) {
        console.log({ error });
    }
};

const getTeamsFromWiki = async (url) => {
    try {
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });

        const $ = cheerio.load(response.body);
        // #mw-content-text > div.mw-parser-output > table:nth-child(20) > tbody > tr:nth-child(1) > td:nth-child(1) > a

        const teams = [];
        $("#mw-content-text")
            .find("table.sortable > tbody")
            .first()
            .children("tr")
            .each((idxx, elem) => {
                const team = {};
                team.name = $(elem).find("td:nth-child(1)").find("a").text().trim();
                team.longName = $(elem).find("td:nth-child(1)").find("a").attr("title");
                team.wikiLink = `https://en.wikipedia.org/${$(elem).find("td:nth-child(1)").find("a").attr("href")}`;

                if (team.name) {
                    teams.push(team);
                }
            });
        return teams;
    } catch (error) {
        console.log({ error });
        return [];
    }
};

const generateFootballData = async (queryString) => {
    const url = await getFootballWikiTopResultLink(queryString);
    if (url === "failed") {
        return {};
    }

    const data = await scrapeFootballWikiData(url);
    if (data) {
        console.log("found fbwiki ", { data });
        return {
            info: data.info,
            footballWikiUrl: data.footballWikiUrl,
            footballWikiId: data.footballWikiId,
        };
    }
    return data;
};

// getWikiImage(testData.data[0].wikiLink);
// async function testMe() {
//     const topResultUrl = await getFootballWikiTopResultLink("liverpool");
//     console.log({ topResultUrl });
//     const someInfo = await scrapeFootballWikiData(topResultUrl);
//     console.log({ someInfo });
// }
// testMe();

module.exports = {
    getWikiImage,
    generateFootballData,
    getTeamsFromWiki,
    getTopScorersFromWiki,
    scrapeFootballWikiData,
};
