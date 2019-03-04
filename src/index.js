/* eslint-disable no-unused-vars */
const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const config = require('../config');
const log = require('./lib/logger')();

const redisUrl = config.get('REDIS_URL');
const { TaskAdapter } = require('./adapter');
const { taskController } = require('./controller');
const { filterRequest, requestValidation } = require('./middleware');

let app;
let ioredis;
let taskAdapter;

function startExpressServer() {
  return new Promise((resolve, reject) => {
    app = express();
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

    app.on('error', (err) => {
      log.error(err, 'server startup failed');
      reject(err);
    });

    if (process.env.NODE_ENV === 'test') {
      resolve(app);
      return app;
    }
    app.listen(config.get('PORT') || 3000, () => {
      log.info('express was successfully started');
      resolve(app);
    });
    return app;
  });
}

function createRedisClient() {
  return new Promise((resolve, reject) => {
    ioredis = new Redis(redisUrl);
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

function runAdapter() {
  taskAdapter = new TaskAdapter(ioredis);
  if (process.env.NODE_ENV !== 'test') {
    taskAdapter.pollWaitingQueue();
    taskAdapter.pollProcessQueue();
  }
  return taskAdapter;
}

function getApp() {
  return app;
}

function getRedisCli() {
  return ioredis;
}

function getTaskAdapter() {
  if (!taskAdapter) {
    return runAdapter();
  }
  return taskAdapter;
}

function runApplication() {
  return createRedisClient()
    .then(() => runAdapter(ioredis))
    .then(() => startExpressServer(taskAdapter));
}

module.exports.run = runApplication;
module.exports.getTaskAdapter = getTaskAdapter;
module.exports.getApp = getApp;
module.exports.getRedisCli = getRedisCli;
module.exports.startExpressServer = startExpressServer;
module.exports.createRedisClient = createRedisClient;
