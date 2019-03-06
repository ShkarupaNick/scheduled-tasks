const { middlerifyAsync } = require('../lib/utils');

const SUPPORTED_EVENTS = [
  'echoAtTime',
  'echoAfterDelay',
];
/**
 * Filtering supported requests
 * @param {object} req - http request, req.params.event - type of events
 * @throws Will throw an error if the event is not supported.
 */
module.exports = middlerifyAsync(async (req) => {
  if (SUPPORTED_EVENTS.includes(req.params.callType)) {
    return;
  }
  const e = new Error(`event ${req.params.callType} not supported`);
  e.code = 400;
  throw e;
});
