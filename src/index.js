const fs = require('fs');
const path = require('path');

// * globals
global.ROOT = path.join(__dirname, '..');

// * prettier
const prettier = require('prettier');

// * jsdom
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'template.html'), 'utf-8'));
const { document } = dom.window;

// * showdown
const showdown = require('showdown');
const converter = new showdown.Converter();
converter.setFlavor('github');

// * utils
const { GET } = require('./utils');
const log = require('./utils/log');
const filter = require('./utils/filter');

const notFoundRegex = /404 Not Found/gi;
const remixContextRegex = /window\.__remixContext\s*=\s*({[\s\S]*?});__remixContext.p/g;

const updateLogIndex = async (title, fileName) => {
  log.info('Updating chat index...');

  const indexDom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8'));
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
  const gptHtml = await GET(url);
  if (notFoundRegex.test(gptHtml)) throw new Error('404 Not Found');
  log.success('Chat data extracted successfully!!!');

  const __html = remixContextRegex.exec(gptHtml)[1];

  const remixContext = JSON.parse(__html);
  const data = remixContext.state.loaderData['routes/share.$shareId.($action)'].serverResponse.data;
  const { title, linear_conversation } = data;
  const conversation = linear_conversation.slice(2);
  let html = '';

  log.warn('Chat Title:', title);
  const header = document.querySelector('header');
  const heading = document.createElement('h1');

  heading.textContent = title;
  header.append(heading);

  for (const { message } of conversation) {
    const { author, content } = message;
    const { parts, content_type } = content;
    const { role } = author;

    if (content_type !== 'text') continue;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const isUser = role === 'user';

    if (isUser) {
      bubble.classList.add('user');
      const bubbleText = parts.join('');
      bubble.textContent = bubbleText;
    } else {
      const bubbleHtml = converter.makeHtml(parts.join(''));
      bubble.innerHTML = bubbleHtml;
    }

    html += bubble.outerHTML;
  }

  const content = document.querySelector('.content');
  content.innerHTML = html;
  html = await prettier.format(document.documentElement.outerHTML, { parser: 'html' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}.html`;

  log.info("Generating chat's HTML...");
  fs.writeFileSync(fileName, html, 'utf-8');
  log.success("Chat's HTML was generated successfully");

  const [repo, account] = await filter(updateLogIndex.bind(null, title, fileName));

  log.success('Chat log was generated successfully');

  if (repo && account) {
    const logURL = `https://${account}.github.io/${repo}/${fileName}`;
    log.info('Visit your log at:', logURL);
  }
};

module.exports = logGPT;
