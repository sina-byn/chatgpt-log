#!/usr/bin/env node

const logGPT = require('../src');

const { execSync } = require('child_process');

// * prompts
const prompts = require('prompts');

// * commander
const { program } = require('commander');

// * utils
const log = require('../src/utils/log');

program
  .name('loggpt')
  .argument('[url]', "chat-gpt's share URL")
  .action(async url => {
    if (!url) {
      const resp = await prompts({
        name: 'url',
        type: 'text',
        message: "Enter Chat-GPT's share URL",
      });

      url = resp.url;
    }

    if (url.trim()) logGPT(url);
  });

process.on('uncaughtException', error => {
  log.error(error);

  execSync('git restore --staged .');
  execSync('git restore .');
  execSync('git switch main');

  process.exit();
});

program.parse();
