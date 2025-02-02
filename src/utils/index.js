// * puppeteer
const puppeteer = require('puppeteer').default;

// * jsdom
const { JSDOM } = require('jsdom');

exports.extractChatData = async url => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitForSelector('[role="presentation"] article .markdown', { timeout: 60_000 });

  const outerHTML = await page.evaluate(() => document.documentElement.outerHTML);
  const dom = new JSDOM(outerHTML);
  const { document } = dom.window;

  document.querySelectorAll('svg, .sr-only').forEach(el => el.remove());

  const title = document.title;
  const chatBubbles = [...document.querySelectorAll('[role="presentation"] article')];
  const chatBubblesHTML = chatBubbles.map(bubble => bubble.outerHTML).join('\n');

  await browser.close();

  return [title, chatBubblesHTML];
};
