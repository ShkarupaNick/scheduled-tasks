const nconf = require('nconf');
const path = require('path');
const DEFAULTS = require('./default.json');

const ENVIRONMENT = process.env.NODE_ENV;

nconf.file(path.resolve(__dirname, `${ENVIRONMENT}.json`));
nconf.env();
nconf.defaults(DEFAULTS);
nconf.required([
  'PORT',
  'REDIS_URL',
  'PROCESS_QUEUE_NAME',
  'WAIT_QUEUE_NAME',
]);

module.exports = nconf;
