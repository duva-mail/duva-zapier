const test = require('node:test');
const assert = require('node:assert/strict');
const zapier = require('zapier-platform-core');
const nock = require('nock');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const API = 'https://api.duva.ca';
const AUTH = { apiKey: 'dv_secret', domain: 'example.com' };
const ID = `msg_${'0'.repeat(31)}1`;

const bundle = (inputData = {}, authData = AUTH) => ({ inputData, authData });

test.beforeEach(() => nock.disableNetConnect());
test.afterEach(() => {
  assert.deepEqual(nock.pendingMocks(), [], 'a mocked request was never made');
  nock.cleanAll();
});

test('authentication: reads one suppression with the key as a Bearer token', async () => {
  nock(API, { reqheaders: { authorization: 'Bearer dv_secret' } })
    .get('/v1/example.com/suppressions')
    .query({ limit: 1 })
    .reply(200, { data: [], next_cursor: null });

  const result = await appTester(App.authentication.test, bundle());

  assert.deepEqual(result, { data: [], next_cursor: null });
});

test('authentication: a pasted URL or path is refused before any request', async () => {
  for (const domain of ['https://example.com', 'example.com/path', 'ex ample.com', '']) {
    await assert.rejects(
      appTester(App.authentication.test, bundle({}, { ...AUTH, domain })),
      /domain name only/,
      domain,
    );
  }
});

test('a domain name with punycode or subdomains is accepted', async () => {
  nock(API).get('/v1/xn--caf-dma.mail.example.com/suppressions').query({ limit: 1 }).reply(200, { data: [] });

  await appTester(App.authentication.test, bundle({}, { ...AUTH, domain: 'xn--caf-dma.mail.example.com' }));
});

test('authentication: a refused key (404 on purpose) becomes one clear message', async () => {
  nock(API)
    .get('/v1/example.com/suppressions')
    .query({ limit: 1 })
    .reply(404, { error: { code: 'not_found', message: 'Introuvable' } });

  await assert.rejects(
    appTester(App.authentication.test, bundle()),
    /did not accept this API key for this domain/,
  );
});

test('send email: maps the inputs to the Duva request and returns the accepted message', async () => {
  const scope = nock(API, {
    reqheaders: { authorization: 'Bearer dv_secret', 'idempotency-key': 'order-42' },
  })
    .post('/v1/example.com/messages', {
      from: 'Shop <shop@example.com>',
      to: ['a@example.org', 'Bea <b@example.org>'],
      subject: 'Order',
      cc: ['c@example.org'],
      tags: ['order'],
      text: 'Thanks',
      html: '<p>Thanks</p>',
      reply_to: 'help@example.com',
    })
    .reply(202, { id: ID, status: 'queued' });

  const result = await appTester(
    App.creates.send_email.operation.perform,
    bundle({
      from: 'Shop <shop@example.com>',
      to: ['a@example.org', 'Bea <b@example.org>'],
      subject: 'Order',
      cc: ['c@example.org'],
      bcc: [],
      tags: ['order'],
      text: 'Thanks',
      html: '<p>Thanks</p>',
      reply_to: 'help@example.com',
      idempotency_key: 'order-42',
    }),
  );

  assert.deepEqual(result, { id: ID, status: 'queued' });
  assert.ok(scope.isDone());
});

test('send email: no Idempotency-Key header unless one is given, no empty optional fields', async () => {
  nock(API, { badheaders: ['idempotency-key'] })
    .post('/v1/example.com/messages', {
      from: 'shop@example.com',
      to: ['a@example.org'],
      subject: 'Hi',
      text: 'x',
    })
    .reply(202, { id: ID, status: 'queued' });

  await appTester(
    App.creates.send_email.operation.perform,
    bundle({ from: 'shop@example.com', to: ['a@example.org'], subject: 'Hi', text: 'x', html: '' }),
  );
});

test('send email: stops before any request when there is no body', async () => {
  await assert.rejects(
    appTester(
      App.creates.send_email.operation.perform,
      bundle({ from: 'shop@example.com', to: ['a@example.org'], subject: 'Hi' }),
    ),
    /text body, an HTML body, or both/,
  );
});

test('send email: a validation error shows the message and the failing fields', async () => {
  nock(API)
    .post('/v1/example.com/messages')
    .reply(422, {
      error: {
        code: 'invalid_request',
        message: 'Invalid message.',
        fields: [{ field: 'from', message: 'domain not allowed' }],
      },
    });

  await assert.rejects(
    appTester(
      App.creates.send_email.operation.perform,
      bundle({ from: 'a@other.com', to: ['a@example.org'], subject: 'Hi', text: 'x' }),
    ),
    /Invalid message\. from: domain not allowed/,
  );
});

test('a rate limit is retried later, a quota is not', async () => {
  nock(API)
    .post('/v1/example.com/messages')
    .reply(429, { error: { code: 'rate_limited', message: 'Slow down' } }, { 'Retry-After': '7' });
  await assert.rejects(
    appTester(
      App.creates.send_email.operation.perform,
      bundle({ from: 'shop@example.com', to: ['a@example.org'], subject: 'Hi', text: 'x' }),
    ),
    (error) => /Slow down/.test(error.message) && /"delay":7/.test(error.message),
  );

  nock(API)
    .post('/v1/example.com/messages')
    .reply(429, { error: { code: 'quota_exceeded', message: 'Daily quota reached' } });
  await assert.rejects(
    appTester(
      App.creates.send_email.operation.perform,
      bundle({ from: 'shop@example.com', to: ['a@example.org'], subject: 'Hi', text: 'x' }),
    ),
    (error) => /Daily quota reached/.test(error.message) && !/delay/.test(error.message),
  );
});

test('add suppression: posts the address and returns the entry', async () => {
  nock(API)
    .post('/v1/example.com/suppressions', { email: 'client@example.org' })
    .reply(201, { email: 'client@example.org', reason: 'manual', created_at: '2026-10-10T12:00:00Z' });

  const result = await appTester(
    App.creates.add_suppression.operation.perform,
    bundle({ email: 'client@example.org' }),
  );

  assert.equal(result.reason, 'manual');
});

test('new event: returns the events newest first, filtered by type and recipient', async () => {
  const events = [
    { id: 'evt_2', type: 'bounced', recipient: 'b@example.com', occurred_at: '2026-10-10T12:00:00Z' },
    { id: 'evt_1', type: 'bounced', recipient: 'b@example.com', occurred_at: '2026-10-10T11:00:00Z' },
  ];
  nock(API, { reqheaders: { authorization: 'Bearer dv_secret' } })
    .get('/v1/example.com/events')
    .query({ limit: 100, type: 'bounced', recipient: 'b@example.com' })
    .reply(200, { data: events, next_cursor: null });

  const results = await appTester(
    App.triggers.new_event.operation.perform,
    bundle({ type: 'bounced', recipient: 'b@example.com' }),
  );

  assert.deepEqual(results.map((e) => e.id), ['evt_2', 'evt_1']);
});

test('new event: without filters it asks for every type', async () => {
  nock(API).get('/v1/example.com/events').query({ limit: 100 }).reply(200, { data: [] });

  assert.deepEqual(await appTester(App.triggers.new_event.operation.perform, bundle()), []);
});
