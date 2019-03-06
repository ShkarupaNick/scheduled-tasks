const bunyan = require('bunyan');
const bformat = require('bunyan-format');

const formatOut = bformat({ outputMode: 'short', levelInString: true });

const lvlMap = {};
lvlMap.FATAL = bunyan.FATAL;
lvlMap.ERROR = bunyan.ERROR;
lvlMap.WARN = bunyan.WARN;
lvlMap.INFO = bunyan.INFO;
lvlMap.DEBUG = bunyan.DEBUG;
lvlMap.TRACE = bunyan.TRACE;


const config = require('../../config');

const logLevel = config.get('LOG_LEVEL') || process.env.LOG_LEVEL || 'INFO';

const { name: appName } = require('../../package');

function getLogger() {
  let logger;
  return function createLogger() {
    if (!logger) {
      logger = bunyan.createLogger({
        name: appName,
        level: lvlMap[logLevel.toUpperCase()],
        stream: formatOut,
      });
    }
    return logger;
  };
}

module.exports = getLogger();
