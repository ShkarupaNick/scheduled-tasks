const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const config = require('../config');
const log = require('./lib/logger')();

const redisUrl = config.get('REDIS_URL');
const TaskAdapter = require('./adapter/taskAdapter');
const { taskController } = require('./controller');


function startExpressServer(taskAdapter) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true,
    }));
    app.post('/tasks/echoAtTime',
      (req, res, next) => {
        req.taskAdapter = taskAdapter;
        next();
      },
      taskController.publishTaskAtTime);

    app.post('/tasks/echoAfterDelay',
      (req, res, next) => {
        req.taskAdapter = taskAdapter;
        next();
      },
      taskController.publishTaskAfterDelay);

    app.listen(config.get('PORT') || 3000, () => {
      log.info('express was successfully started');
      resolve(app);
    });

    app.on('error', (err) => {
      log.error(err, 'server startup failed');
      reject(err);
    });
  });
}

function createRedisClient() {
  return new Promise((resolve, reject) => {
    const ioredis = new Redis(redisUrl);
    ioredis
      .on('error', (e) => {
        console.error('ioredis error', e);
        reject(e);
      })
      .on('connect', () => {
        log.info('connected to redis with ioredis');
      })
      .on('ready', () => {
        log.info('ready for all redis connections');
        resolve(ioredis);
      });
  });
}

function runAdapter(ioredis) {
  const taskAdapter = new TaskAdapter(ioredis);
  taskAdapter.pollWaitingQueue();
  taskAdapter.pollProcessQueue();
  return taskAdapter;
}

function runApplication() {
  return createRedisClient()
    .then(ioredis => runAdapter(ioredis))
    .then(taskAdapter => startExpressServer(taskAdapter));
}


module.exports.run = runApplication;
