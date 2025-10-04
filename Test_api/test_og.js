import puppeteer from "puppeteer";

async function getInstagramOG(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const data = await page.evaluate(() => {
    const title = document.querySelector('meta[property="og:title"]')?.content;
    const image = document.querySelector('meta[property="og:image"]')?.content;
    return { title, image };
  });
  await browser.close();
  return data;
}

getInstagramOG("https://www.tiktok.com/@charlidamelio/video/7221234567891234567").then(console.log);
