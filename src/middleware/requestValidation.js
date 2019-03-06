const _ = require('lodash');
const { middlerifyAsync } = require('../lib/utils');
const log = require('../lib/logger')();

function validate(callType, inputBody) {
  log.info('Got request: %j', inputBody);
  const requiredProps = {
    echoAtTime: [
      'echoAtTime',
      'message',
    ],
    echoAfterDelay: [
      'scheduledTimeDelay',
      'message',
    ],
  }[callType];
  requiredProps.forEach((prop) => {
    if (!_.hasIn(inputBody, prop)) {
      const e = new Error(`Can not find ${prop} property. Please check request...`);
      e.code = 400;
      throw e;
    }
  });
}

module.exports = middlerifyAsync(async (req) => {
  await validate(req.params.callType, req.body);
});
