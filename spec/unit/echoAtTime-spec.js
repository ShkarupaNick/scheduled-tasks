// TODO need to cover by unit tests
/* eslint-disable  import/no-extraneous-dependencies */
// const { assert } = require('chai');
const sinon = require('sinon');
// const nock = require('no      ck');
const request = require('supertest');
// const config = require('../../config');
const app = require('../../src');

describe('routes', () => {
  let redisCli;
  let expressApp;

  before(async () => {
    redisCli = await app.createRedisClient();
    expressApp = await app.startExpressServer();
    const taskAdapter = app.getTaskAdapter();
    sinon.stub(taskAdapter, 'pollProcessQueue')
      .callsFake(() => ({}));
    sinon.stub(taskAdapter, 'pollWaitingQueue')
      .callsFake(() => ({}));
  });

  beforeEach(async () => {
  });

  it('/tasks/:callType', () => {
    it('valid request', () => {
      request(expressApp)
        .get('/users')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });

  after(() => {
    redisCli.disconnect();
  });
});
