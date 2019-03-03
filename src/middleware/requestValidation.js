const _ = require('lodash');
const { middlerifyAsync } = require('../lib/utils');

function validate(callType, inputBody) {
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
