const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

async function scrapeData() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
    });

    const page = await browser.newPage();

    const leetcodeItems = [];
    await page.goto('https://leetcode.com/contest/', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('body > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > div > a > div > div > div > div > span');
    const leetcodeName = await page.evaluate(() => Array.from(document.querySelectorAll('body > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > div > a > div > div > div > div > span')).map(x => x.textContent));
    const leetcodeStartsInTemp = await page.evaluate(() => Array.from(document.querySelectorAll('body > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > div > div > a > div > div:nth-child(3) > div')).map(x => x.textContent));

    for (let i = 0; i < leetcodeStartsInTemp.length; i++) {
        const daysMatch = leetcodeStartsInTemp[i].match(/\b(\d+)d\b/);
        const hoursMatch = leetcodeStartsInTemp[i].match(/\b(\d+)h\b/);
        const minutesMatch = leetcodeStartsInTemp[i].match(/\b(\d+)m\b/);

        const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        const totalDuration = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60) * 1000;
        const currentDate = new Date();
        const targetDate = new Date(currentDate.getTime() + totalDuration).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        });

        leetcodeItems.push({
            name: leetcodeName[i],
            date: targetDate,
            duration: "1:30 Hrs",
            startsIn: days > 1 ? `${days} Days` : `${days} Day`
        });
    }

    const codechefItems = [];
    await page.goto('https://www.codechef.com/contests?itm_medium=navmenu');
    await page.waitForSelector("#root > div > div > div > div > div > div:nth-child(2) > div > div > div > table > tbody > tr > td:nth-child(2) > div > a > span", 1200000);
    const codechefName = await page.evaluate(() => Array.from(document.querySelectorAll('#root > div > div > div > div > div > div:nth-child(1) > div > div > div > table > tbody > tr > td:nth-child(2) > div > a > span')).map(x => x.textContent));
    const codechefDate = await page.evaluate(() => Array.from(document.querySelectorAll('#root > div > div > div > div > div > div:nth-child(1) > div > div > div > table > tbody > tr > td:nth-child(3) > div > div')).map(x => x.textContent));
    const codechefDuration = await page.evaluate(() => Array.from(document.querySelectorAll('#root > div > div > div > div > div > div:nth-child(1) > div > div > div > table > tbody > tr > td:nth-child(4) > div > div > p')).map(x => x.textContent));
    const codechefStartsIn = await page.evaluate(() => Array.from(document.querySelectorAll('#root > div > div > div > div > div > div:nth-child(1) > div > div > div > table > tbody > tr > td:nth-child(5) > div > div > p:nth-child(1)')).map(x => x.textContent));

    for (let i = 0; i < codechefName.length; i++) {
        let [day, month, year, time] = codechefDate[i].split(/\s+/);
        const weekday = year.slice(-3);
        year = year.slice(0, -3);
        const monthNumber = new Date(Date.parse(`${month} 1, 2000`)).getMonth() + 1;
        const standardizedDateString = `${weekday} ${monthNumber} ${day} ${year} ${time}`;
        const dateObject = new Date(standardizedDateString);
        const formattedDate = dateObject.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        });

        codechefItems.push({
            name: codechefName[i],
            date: formattedDate,
            duration: codechefDuration[i],
            startsIn: codechefStartsIn[i]
        });
    }

    const codeforcesItems = [];
    await page.goto('https://codeforces.com/contests');
    const codeforcesName = await page.evaluate(() => Array.from(document.querySelectorAll('#pageContent > div.contestList > div.datatable > div > table > tbody > tr > td.left')).map(x => x.textContent));
    const codeforcesDate = await page.evaluate(() => Array.from(document.querySelectorAll('#pageContent > div.contestList > div.datatable > div > table > tbody > tr > td > a:not([class])')).map(x => x.innerHTML.split('<')[0]));
    const codeforcesDuration = await page.evaluate(() => Array.from(document.querySelectorAll('#pageContent > div.contestList > div.datatable > div > table > tbody > tr > td:nth-child(4)')).map(x => x.textContent));
    const codeforcesStartsIn = await page.evaluate(() => Array.from(document.querySelectorAll('#pageContent > div.contestList > div.datatable > div > table > tbody > tr > td.state > span > span')).map(x => x.textContent));

    for (let i = 0; i < codeforcesName.length; i++) {
        codeforcesItems.push({
            name: codeforcesName[i].replace(/\n/g, "").trim(),
            date: codeforcesDate[i].replace(/\n/g, "").trim(),
            duration: codeforcesDuration[i].replace(/\n/g, "").trim() + ' Hrs',
            startsIn: codeforcesStartsIn[i]
        });
    }

    const fullData = [
        { platform: "codechef", contests: codechefItems },
        { platform: "leetcode", contests: leetcodeItems },
        { platform: "codeforces", contests: codeforcesItems }
    ];

    await browser.close();
    return fullData;
}

app.get('/contests', async (req, res) => {
    try {
        const data = await scrapeData();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred while scraping data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
