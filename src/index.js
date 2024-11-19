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
const filter = require('./utils/filter');

const remixContextRegex = /window\.__remixContext\s*=\s*({[\s\S]*?});/g;

const logGPT = async url => {
  const gptHtml = await GET(url);
  const remixContext = JSON.parse(remixContextRegex.exec(gptHtml)[1]);
  const data = remixContext.state.loaderData['routes/share.$shareId.($action)'].serverResponse.data;
  const { title, linear_conversation } = data;
  const conversation = linear_conversation.slice(2);
  let html = '';

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
  fs.writeFileSync(`${timestamp}.html`, html, 'utf-8');

  filter();
};

module.exports = logGPT;
