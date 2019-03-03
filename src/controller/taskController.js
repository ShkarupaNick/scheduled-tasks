const log = require('../lib/logger')();

module.exports = {
  async echoAfterDelay(req, res) {
    if (!req.body.message) {
      const errMsg = 'message property is required';
      log.error(errMsg);
      res.status(400).send(errMsg);
    }
    if (!req.body.scheduledTimeDelay && req.body.scheduledTimeDelay !== 0) {
      const errMsg = 'scheduledTimeDelay property is required';
      log.error(errMsg);
      res.status(400).send();
      return;
    }
    log.info('Got POST request: %j', req.body);
    const result = await req.taskAdapter.publishTaskAfterDelay(req.body.message,
      req.body.scheduledTimeDelay);
    res.send(JSON.stringify(result));
  },

  async echoAtTime(req, res) {
    if (!req.body.message) {
      res.status(400).send('Bad Request. message property is required');
    }
    if (!req.body.echoAtTime) {
      res.status(400).send('Bad Request. echoAtTime property is required');
      return;
    }
    const time = Date.parse(req.body.echoAtTime);
    if (!time) {
      const errMsg = 'Error while trying to parse echoAtTime parameter. PLease check format nd try again';
      log.error(errMsg);
      res.status(400).send(errMsg);
    }
    log.info('Got POST request: %j', req.body);
    const result = await req.taskAdapter.publishTaskAtTime(req.body.message,
      time);
    res.send(JSON.stringify(result));
  },
};
