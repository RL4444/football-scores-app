const request = require("request-promise");
const fs = require("fs");
const cheerio = require("cheerio");

async function getStandings(url, competition, createJSONLocal = false) {
    try {
        const html = await request.get(url);
        const $ = cheerio.load(html);

        const table = $("tbody");
        const standings = table
            .find("tr")
            .map((index, tableRow) => {
                if (competition === "premier-league") {
                    return {
                        position: $(tableRow).find("td").eq(0).text(),
                        teamName: $(tableRow).find("td").eq(1).text(),
                        points: $(tableRow).find("td").eq(9).text(),
                        form: $(tableRow)
                            .find("td")
                            .eq(10)
                            .find("ul > li")
                            .map((formIndex, formItem) => $(formItem).find("div > div").text())
                            .get(),
                        played: $(tableRow).find("td").eq(2).text(),
                        won: $(tableRow).find("td").eq(3).text(),
                        lost: $(tableRow).find("td").eq(4).text(),
                        drawn: $(tableRow).find("td").eq(5).text(),
                        goalsFor: $(tableRow).find("td").eq(6).text(),
                        goalsAgainst: $(tableRow).find("td").eq(7).text(),
                        goalDifference: $(tableRow).find("td").eq(8).text(),
                    };
                } else {
                    return {
                        position: $(tableRow).find("td").eq(0).text(),
                        teamName: $(tableRow).find("td").eq(2).find("abbr").attr("title"),
                        points: $(tableRow).find("td").eq(10).text(),
                        form: $(tableRow)
                            .find("td")
                            .eq(11)
                            .find("span.sp-c-team-form")
                            .map((formIndex, formItem) => $(formItem).find("span").first().text())
                            .get(),
                        played: $(tableRow).find("td").eq(3).text(),
                        won: $(tableRow).find("td").eq(4).text(),
                        won: $(tableRow).find("td").eq(5).text(),
                        drawn: $(tableRow).find("td").eq(6).text(),
                        goalsFor: $(tableRow).find("td").eq(7).text(),
                        goalsAgainst: $(tableRow).find("td").eq(8).text(),
                        goalDifference: $(tableRow).find("td").eq(9).text(),
                    };
                }
            })
            .get();
        if (createJSONLocal) {
            const outputJsonData = { data: standings };
            const filePath = `${competition}.json`;
            fs.writeFileSync("./json_output/standings/" + filePath, JSON.stringify(outputJsonData));
        }
        return { data: standings, error: false };
    } catch (error) {
        return { data: null, error: true, message: error };
    }
}

module.exports = getStandings;
// getStandings('https://www.bbc.com/sport/football/german-bundesliga/table', 'bundesliga_1');
