/**
 * Caelochronis weather scheduler.
 * Cloudflare's cron triggers an existing GitHub Actions workflow.
 * The Weather Underground key remains in GitHub Actions secrets.
 */
const DISPATCH_URL =
  'https://api.github.com/repos/Botribor/caelochronis/actions/workflows/weather.yml/dispatches';

/** Dispatch a workflow without storing or logging the GitHub credential. */
export async function dispatchWeatherUpdate(env, send = fetch) {
  const token = env?.GITHUB_ACTIONS_TOKEN;
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('GITHUB_ACTIONS_TOKEN non configurato nel Worker.');
  }

  const response = await send(DISPATCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Caelochronis-Weather-Scheduler',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main' }),
  });

  // 204 means GitHub accepted the request, NOT that the workflow completed.
  if (response.status !== 204) {
    throw new Error(`GitHub non ha accettato l'aggiornamento (HTTP ${response.status}).`);
  }
  console.log('Richiesta di raccolta meteo accettata da GitHub (204).');
  return { accepted: true };
}

export default {
  async fetch() {
    // This Worker is not a public data API or a manually-triggerable webhook.
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(dispatchWeatherUpdate(env));
  },
};
