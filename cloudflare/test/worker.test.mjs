import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { dispatchWeatherUpdate } from '../src/worker.mjs';

test('dispatch a GitHub Actions without exposing the WU key', async () => {
  let details;
  const fakeFetch = async (url, options) => {
    details = { url, ...options };
    return { status: 204 };
  };
  const result = await dispatchWeatherUpdate({ GITHUB_ACTIONS_TOKEN: 'secret-test' }, fakeFetch);
  assert.deepEqual(result, { accepted: true });
  assert.equal(details.url,
    'https://api.github.com/repos/Botribor/caelochronis/actions/workflows/weather.yml/dispatches');
  assert.equal(details.method, 'POST');
  assert.equal(details.headers.Authorization, 'Bearer secret-test');
  assert.equal(details.headers['X-GitHub-Api-Version'], '2022-11-28');
  assert.deepEqual(JSON.parse(details.body), { ref: 'main' });
});

test('does not dispatch without the token', async () => {
  await assert.rejects(() => dispatchWeatherUpdate({}, async () => {
    throw new Error('Must not run');
  }), /non configurato/);
});

test('reports GitHub errors without leaking credentials', async () => {
  await assert.rejects(() => dispatchWeatherUpdate({ GITHUB_ACTIONS_TOKEN: 'top-secret' },
    async () => ({ status: 403 })), (error) => {
    assert.match(error.message, /HTTP 403/);
    assert.ok(!error.message.includes('top-secret'));
    return true;
  });
});

test('public HTTP requests cannot trigger a dispatch', async () => {
  const response = await worker.fetch();
  assert.equal(response.status, 404);
});

test('Cron uses waitUntil', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ status: 204 });
    let pending;
    await worker.scheduled({ cron: '2,12,22,32,42,52 * * * *' },
      { GITHUB_ACTIONS_TOKEN: 'secret-test' },
      { waitUntil: (promise) => { pending = promise; } });
    assert.ok(pending);
    assert.deepEqual(await pending, { accepted: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
