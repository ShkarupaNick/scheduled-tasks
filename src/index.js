/* eslint-disable no-unused-vars */
const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const config = require('../config');
const log = require('./lib/logger')();

const redisUrl = config.get('REDIS_URL');
const TaskAdapter = require('./adapter/taskAdapter');
const { taskController } = require('./controller');
const { filterRequest, requestValidation } = require('./middleware');

function startExpressServer(taskAdapter) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true,
    }));

    app.post('/tasks/:callType',
      filterRequest,
      requestValidation,
      (req, res, next) => {
        req.taskAdapter = taskAdapter;
        next();
      },
      async (req, res) => {
        res.result = await taskController[req.params.callType](req, res);
      });

    /**
     * request-error middleware
     * */
    app.use((err, req, res, next) => {
      res.set('Content-Type', 'application/json');
      res.status(err.code || 500);
      res.send({
        code: err.code || 500,
        message: err.message,
        detail: err.stack,
      });
    });

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
        log.error('ioredis error', e);
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
