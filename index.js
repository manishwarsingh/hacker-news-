const puppeteer = require('puppeteer');
function run (pagesToScrape) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!pagesToScrape) {
                pagesToScrape = 1;
            }
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (request.resourceType() === 'document') {
                    request.continue();
                } else {
                    request.abort();
                }
            });
            await page.goto("https://news.ycombinator.com/");
            let currentPage = 1;
            let urls = [];
            while (currentPage <= pagesToScrape) {
                await page.waitForSelector('a.storylink');
                let newUrls = await page.evaluate(() => {
                    let results = [];
                    let items = document.querySelectorAll('a.storylink');
                    items.forEach((item) => {
                        results.push({
                            url:  item.getAttribute('href'),
                            text: item.innerText,
                        });
                    });
                    return results;
                });
                urls = urls.concat(newUrls);
                if (currentPage < pagesToScrape) {
                    await Promise.all([
                        await page.waitForSelector('a.morelink'),
                        await page.click('a.morelink'),
                        await page.waitForSelector('a.storylink')
                    ])
                }
                currentPage++;
            }
            browser.close();
            return resolve(urls);
        } catch (e) {
            return reject(e);
        }
    })
}
run(5).then(console.log).catch(console.error);