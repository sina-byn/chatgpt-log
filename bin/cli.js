#!/usr/bin/env node

const logGPT = require('../src');

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

    logGPT(url);
  });

process.on('uncaughtException', error => {
  log.error(error);
});

program.parse();
