/* eslint-disable  import/no-extraneous-dependencies */
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src');
const config = require('../../config');

const processQueueName = config.get('PROCESS_QUEUE_NAME');
const waitQueueName = config.get('WAIT_QUEUE_NAME');
const badRequestError = {
  code: 400,
  message: 'Can not find echoAtTime property. Please check request...',
};

describe('routes', () => {
  let redisCli;
  let expressApp;
  let taskAdapter;

  before(async () => {
    await app.run();
    redisCli = await app.getRedisCli();
    expressApp = await app.getApp();
    taskAdapter = app.getTaskAdapter();
  });

  beforeEach(async () => {

  });

  it('invalid request structure echoAtTime', (done) => {
    const text = 'Test todo test';
    request(expressApp)
      .post('/tasks/echoAtTime')
      .send({ text })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).to.be.eql(400);
        expect(res.body.code).to.eql(badRequestError.code);
        expect(res.body.message).to.eql(badRequestError.message);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        return done();
      });
  });

  it('invalid request structure echoAfterDelay', (done) => {
    badRequestError.message = 'Can not find scheduledTimeDelay property. Please check request...';
    const text = 'Test todo test';
    request(expressApp)
      .post('/tasks/echoAfterDelay')
      .send({ text })
      .expect(400)
      .expect((res) => {
        expect(res.body.code).to.be.eql(400);
        expect(res.body.code).to.eql(badRequestError.code);
        expect(res.body.message).to.eql(badRequestError.message);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        return done();
      });
  });

  it('planning for future', (done) => {
    const inputMessage = {
      message: 'Test Message',
      echoAtTime: '2099-03-04 15:16:37',
    };
    request(expressApp)
      .post('/tasks/echoAtTime')
      .send(inputMessage)
      .expect(200, { scheduledAt: '2099-03-04 15:16:37' })
      .end(async (err) => {
        if (err) {
          return done(err);
        }
        const zset = await redisCli.zrange(waitQueueName,
          0,
          -1);
        expect(JSON.parse(zset[0])[1]).to.be.eql('Test Message');
        return done();
      });
  });

  it('planning for past', (done) => {
    const inputMessage = {
      message: 'Test Message',
      echoAtTime: '2001-03-04 15:16:37',
    };
    request(expressApp)
      .post('/tasks/echoAtTime')
      .send(inputMessage)
      .expect(200, { scheduledAt: '2001-03-04 15:16:37' })
      .end(async (err) => {
        if (err) {
          return done(err);
        }
        const msgObj = await redisCli.lrange(processQueueName, 0, 1);
        const msg = JSON.parse(msgObj[0]);
        expect(msg[1]).to.be.eql('Test Message');
        return done();
      });
  });

  after(async () => {
    await redisCli.del(waitQueueName);
    await redisCli.del(processQueueName);
  });
  after(() => {
    taskAdapter.disconnectAll();
  });
});
