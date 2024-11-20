const fs = require('fs');

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
const { GET } = require('./utils');
const log = require('./utils/log');
const filter = require('./utils/filter');

const notFoundRegex = /404 Not Found/gi;
const remixContextRegex = /window\.__remixContext\s*=\s*({[\s\S]*?});/g;

const updateLogIndex = async (title, fileName) => {
  const indexDom = new JSDOM(fs.readFileSync('index.html', 'utf-8'));
  const { document } = indexDom.window;

  const container = document.querySelector('.container');

  const log = document.createElement('a');

  log.textContent = title;
  log.href = fileName;

  container.append(log);

  const indexHtml = await prettier.format(document.documentElement.outerHTML, { parser: 'html' });
  fs.writeFileSync('index.html', indexHtml, 'utf-8');
};

const logGPT = async url => {
  log.info('Extracting chat data...');
  const gptHtml = await GET(url);
  if (notFoundRegex.test(gptHtml)) throw new Error('404 Not Found');
  log.success('Chat data extracted successfully!!!');

  const remixContext = JSON.parse(remixContextRegex.exec(gptHtml)[1]);
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

    if (role === 'user') bubble.classList.add('user');

    const bubbleHtml = converter.makeHtml(parts.join(''));
    bubble.innerHTML = bubbleHtml;

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

  log.info('Updating chat index...');
  filter(() => updateLogIndex(title, fileName));
  log.success('Chat index was updated successfully');
};

module.exports = logGPT;
