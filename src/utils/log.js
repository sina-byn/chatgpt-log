const chalk = require('chalk');

const _log = (color, ...inputs) => console.log(chalk[color](...inputs));

const log = (...inputs) => _log('whiteBright', ...inputs);

log.success = (...inputs) => _log('greenBright', ...inputs);
log.error = (...inputs) => _log('redBright', ...inputs);

log.info = (...inputs) => _log('blueBright', ...inputs);
log.warn = (...inputs) => _log('yellowBright', ...inputs);

module.exports = log;
