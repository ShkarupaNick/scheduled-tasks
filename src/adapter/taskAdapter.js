const uuidv1 = require('uuid/v1');
const format = require('date-format');
const microtime = require('microtime');
const log = require('../lib/logger')();
const config = require('../../config');

const processQueueName = config.get('PROCESS_QUEUE_NAME');
const backupQueueName = config.get('BACKUP_QUEUE_NAME');
const waitQueueName = config.get('WAIT_QUEUE_NAME');
const waitqueuebatchsize = config.get('WAIT_QUEUE_BATCH_SIZE');
const brpoplpushTimeout = config.get('PROCESS_BRPOPLPUSH_TIMEOUT_S');
const processQueuePollingFrequency = config.get(
  'PROCESS_QUEUE_POLLING_FREQUENCY_MS',
);
const waitingQueuePollingFrequency = config.get(
  'WAITING_QUEUE_POLLING_FREQUENCY_MS',
);
let pollWaitingQueueCounter = 0;
let pollProcessQueueCounter = 0;
module.exports = class TaskAdapter {
  constructor(cli) {
    this.cli = cli;
    this.pollWaitingTaskCli = cli.duplicate();
    this.proccessTaskCli = cli.duplicate();
  }

  pollWaitingQueue() {
    pollWaitingQueueCounter += 1;
    log.debug(`pollWaitingQueue ${pollWaitingQueueCounter}`);
    return this.pollWaitingTaskCli.watch(waitQueueName)
      .then(() => this.cli.zrangebyscore(waitQueueName,
        '-inf',
        microtime.nowDouble(),
        'WITHSCORES',
        'LIMIT',
        '0',
        waitqueuebatchsize || '1')
        .then((result) => {
          if (!result || result.length === 0) {
            return Promise.resolve()
              .then(() => setTimeout(this.pollWaitingQueue.bind(this),
                waitingQueuePollingFrequency));
          }
          const multi = this.cli.multi();
          const resultObj = result.filter((item, i) => i % 2 === 0);
          resultObj.forEach((record) => {
            const message = JSON.parse(record)[1];
            multi
              .rpush(processQueueName, message)
              .zrem(waitQueueName, record);
          });

          return multi
            .exec()
            .then(() => {
              log.debug(`${resultObj.length} was fetched from waiting queue`);
              log.trace('fetched messages: %j', resultObj);
            })
            .then(() => setTimeout(this.pollWaitingQueue.bind(this),
              waitingQueuePollingFrequency));
        }));
  }

  // reliable queue pattern
  pollProcessQueue() {
    pollProcessQueueCounter += 1;
    log.debug(`pollProcessQueue ${pollProcessQueueCounter}`);
    return this.proccessTaskCli.brpoplpush(processQueueName, backupQueueName,
      brpoplpushTimeout)
      .then((result) => {
        if (result) {
          log.info('received task for execution: %j', result);
          return this.cli.lrem(backupQueueName, 1, result)
            .then(() => setTimeout(this.pollProcessQueue.bind(this),
              processQueuePollingFrequency));
        }
        setTimeout(this.pollProcessQueue.bind(this),
          processQueuePollingFrequency);
        return result;
      })
      .catch(e => log.error(e));
  }

  async publishTaskAfterDelay(message, delay) {
    const identifier = uuidv1();
    const item = JSON.stringify([identifier, message]);
    const time = microtime.nowDouble() + delay;
    if (time > microtime.nowDouble()) {
      await this.cli.zadd(waitQueueName, time, item);
    } else {
      await this.cli.rpush(processQueueName, item);
    }
    return {
      scheduledAt: format.asString('yyyy-MM-dd hh:mm:ss.SSS',
        new Date(time * 1000)),
    };
  }

  async publishTaskAtTime(message, time) {
    const identifier = uuidv1();
    const item = JSON.stringify([identifier, message]);
    if (time > microtime.nowDouble()) {
      await this.cli.zadd(waitQueueName, time, item);
    } else {
      await this.cli.rpush(processQueueName, item);
    }
    return {
      scheduledAt: format.asString('yyyy-MM-dd hh:mm:ss.SSS',
        new Date(time * 1000)),
    };
  }

  async disconnectAll() {
    await this.cli.disconnect();
    await this.proccessTaskCli.disconnect();
    await this.pollWaitingTaskCli.disconnect();
  }
};
