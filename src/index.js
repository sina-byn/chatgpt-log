const fs = require('fs');
const path = require('path');

// * globals
global.ROOT = path.join(__dirname, '..');
process.chdir(ROOT);

// * prettier
const prettier = require('prettier');

// * jsdom
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync('template.html', 'utf-8'));
const { document } = dom.window;

// * showdown
const showdown = require('showdown');
const converter = new showdown.Converter();
converter.setFlavor('github');

// * utils
const { extractChatData } = require('./utils');
const log = require('./utils/log');
const filter = require('./utils/filter');

const updateLogIndex = async (title, fileName) => {
  log.info('Updating chat index...');

  const indexDom = new JSDOM(fs.readFileSync('index.html', 'utf-8'));
  const { document } = indexDom.window;

  const logs = document.querySelector('.logs');

  const logLink = document.createElement('a');

  logLink.textContent = title;
  logLink.href = fileName;

  logs.append(logLink);

  const indexHtml = await prettier.format(document.documentElement.outerHTML, { parser: 'html' });
  fs.writeFileSync('index.html', indexHtml, 'utf-8');

  log.success('Chat index was updated successfully');
};

const logGPT = async url => {
  log.info('Extracting chat data...');
  let [title, html] = await extractChatData(url);

  if (title === '404') throw new Error('404 Not Found');
  log.success('Chat data extracted successfully!!!');

  log.warn('Chat Title:', title);
  log.info("Generating chat's HTML...");
  const header = document.querySelector('header');
  const heading = document.createElement('h1');

  heading.textContent = title;
  header.append(heading);

  const content = document.querySelector('.content');
  content.innerHTML = html;
  html = await prettier.format(document.documentElement.outerHTML, { parser: 'html' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}.html`;

  fs.writeFileSync(fileName, html, 'utf-8');
  log.success("Chat's HTML was generated successfully");

  const [repo, account] = await filter(updateLogIndex.bind(null, title, fileName));

  log.success('Chat log was generated successfully');

  if (repo && account) {
    const logURL = `https://${account}.github.io/${repo}/${fileName}`;
    log.info('Visit your log at:', logURL);
    log.warn('You may need to wait for a few seconds before your github pages is re-deployed');
    require('openurl').open(logURL);
  }
};

module.exports = logGPT;
