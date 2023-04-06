const fs = require("fs");
const cheerio = require("cheerio");
const unirest = require("unirest");
const request = require("request-promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { sleep, generateRandomUserAgentHeader } = require("../../utils");
const { getWikiImage } = require("./wiki");

const { GOOGLE_SEARCH_ENGINE_ID, GOOGLE_SEARCH_API_KEY } = process.env;

const GOOGLE_RIGHT_PANEL_ELEMENT_ID = "#rhs";
const GOOGLE_RIGHT_PANEL_ELEMENT_CONTENT_ID = "#kp-wp-tab-overview";

// Scraped data
const getTeamData = async (url) => {
    try {
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });

        const $ = cheerio.load(response.body);

        let image = $(GOOGLE_RIGHT_PANEL_ELEMENT_ID).find("g-img").attr("data-lpage");
        const wikiLink = $(
            `div${GOOGLE_RIGHT_PANEL_ELEMENT_CONTENT_ID} > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > span:nth-child(3) > a`
        ).attr("href");

        if (!image) {
            const wikiImage = await getWikiImage(wikiLink);
            image = wikiImage || null;
        }

        return {
            image,
            wikiLink,
        };
    } catch (error) {
        console.log("getTeamData ", { error });
    }
};

const getTeamsData = async (url) => {
    try {
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });

        const $ = cheerio.load(response.body);

        const teamList = $("g-scrolling-carousel > div:nth-child(1) > div")
            .children("a")
            .map((elIndex, el) => {
                return {
                    googleName: $(el).attr("title"),
                    googleLink: `https://google.com${$(el).attr("href").trim()}`,
                };
            })
            .get();

        // fs.writeFileSync("./sandbox/teams.json", JSON.stringify({ data: teamList }));

        for (let i = 0; i < teamList.length; i++) {
            console.log("getting google data for team ", teamList[i].googleName, " at link ", teamList[i].googleLink);
            const { image, wikiLink } = await getTeamData(teamList[i].googleLink);
            teamList[i].image = image;
            teamList[i].wikiLink = wikiLink;
            const randomNumber = Math.floor(Math.random() * 4) + 1;
            await sleep(Number(randomNumber + "000"));
        }

        return teamList;
    } catch (error) {
        console.log("getTeamsData ", { error });
    }
};

const getLeagueData = async (queryString = "french ligue 1") => {
    try {
        const url = `https://www.google.com/search?q=${queryString.toLowerCase().replace(" ", "+")}&hl=en-DE`;
        const response = await unirest.get(url).headers({
            "User-Agent": generateRandomUserAgentHeader(),
            "Accept-Language": "en-EN",
        });
        const $ = cheerio.load(response.body);

        const leagueLink = $(`${GOOGLE_RIGHT_PANEL_ELEMENT_ID} > div > div > div:nth-of-type(2) > div > div:nth-of-type(3) > div > a`).attr(
            "href"
        );
        const wikiLink = $(
            `div${GOOGLE_RIGHT_PANEL_ELEMENT_CONTENT_ID} > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > span:nth-child(3) > a`
        ).attr("href");

        let image = $(GOOGLE_RIGHT_PANEL_ELEMENT_ID).find("g-img").attr("data-lpage");
        //  search for elements that being with teams (same in english and german)
        let googleScrapeTeamsLink = "";
        $(`div${GOOGLE_RIGHT_PANEL_ELEMENT_CONTENT_ID}`)
            .children()
            .each((elIdx, el) => {
                if ($(el).text().toLowerCase().startsWith("teams")) {
                    console.log("found the element!");
                    googleScrapeTeamsLink = `https://google.com/${$(el)
                        .find("div > div > div > div > div > div > div:nth-of-type(2) > a")
                        .attr("href")}`;
                }
            });

        if (!image) {
            // let's get it from wikipedia
            console.log("grabbing the image from wiki for ", queryString);
            const wikiImage = await getWikiImage(wikiLink);
            image = wikiImage || null;
        }

        const data = {
            image: image,
            leagueLink,
            googleScrapeTeamsLink,
            competitionName: queryString,
            wikiLink: wikiLink,
        };
        return data;
    } catch ({ error }) {
        console.log("getLeagueData ", { error });
    }
};

//  USING API KEY -- 100 requests per day limit
const getBestGoogleMatch = async (query) => {
    try {
        console.log("running", { query });
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
            query
        )}&start=1`;
        const response = await request.get(url);
        return JSON.parse(response);
    } catch (error) {
        console.log({ error });
    }
};

const getWikiLeagueUrls = async () => {
    const countryCodeKeysArray = Object.values(keys);

    for (let i = 0; i < countryCodeKeysArray.length; i++) {
        const { league } = countryCodeKeysArray[i];
        const query = `${getSeasonYear()} ${league.replace(/-/g, " ")} wikipedia`;

        try {
            console.log("running", { query });
            const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
                query
            )}&start=1`;
            const response = await request.get(url);
            console.log({ response });

            const fileName = `./sandbox/google_api/teams_test_${league.replace(/ /g, "_")}.json`;
            console.log({ fileName });

            fs.writeFileSync(fileName, response);
        } catch (error) {
            fs.writeFileSync("./sandbox/google_api/teams_test_error.json", JSON.stringify({ error: error }));
        } finally {
            await sleep(2000);
        }
    }
};

module.exports = {
    getTeamsData,
    getLeagueData,
    getWikiLeagueUrls,
    getBestGoogleMatch,
};

// getTeamData("https://en.wikipedia.org/wiki/A.C._Milan");
// getLeagueData("italian serie a ");
// getTeamsData(
//     "https://www.google.com/search?hl=en-DE&biw=1031&bih=906&sxsrf=APwXEdfclnhPGJPuf9MLJUfZPiCAWRR3VA:1680515151120&source=lnms&si=&stick=H4sIAAAAAAAAAONgFuLQz9U3MK4qs1SCs7Q0Msqt9JPzc3JSk0sy8_P0iwvyi0qK4xOLi_OTMxNBQsVWJamJucWLWHmLU4syUxUSFcD8HayMAL7JU7BTAAAA&q=serie%20a%20teams&sa=X&ved=2ahUKEwie4_zkto3-AhVnif0HHVnwCWEQ_AUoAHoECAEQAg"
// );
