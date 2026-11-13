// Vercel serverless function: GET /api/turn
// Hands the game short-lived TURN relay credentials so online play works across different networks
// (mobile data, strict school/office Wi-Fi), not only when a direct connection is possible.
// The secret keys live in Vercel's Environment Variables and never reach the browser; only temporary
// credentials do. Supported providers (set ONE of these pairs in Vercel → Settings → Environment Variables):
//   Cloudflare:  CLOUDFLARE_TURN_KEY_ID + CLOUDFLARE_TURN_API_TOKEN
//   Metered:     METERED_DOMAIN (e.g. yourapp.metered.live) + METERED_API_KEY
// With neither set it answers { iceServers: [] } and the game keeps using direct connections only.
const TTL = 24 * 3600; // seconds the credentials stay valid

// Browsers block port 53, so those relay addresses would only slow connecting down
const usable = list => (Array.isArray(list) ? list : [list]).filter(Boolean).map(s => {
  const urls = [].concat(s.urls || s.url || []).filter(u => typeof u === 'string' && !/:53(\?|$)/.test(u));
  return urls.length ? Object.assign({}, s, { urls }) : null;
}).filter(Boolean);

async function fromCloudflare(id, token) {
  const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: TTL }),
  });
  if (!r.ok) throw new Error('cloudflare ' + r.status);
  const d = await r.json();
  return usable(d.iceServers);
}
async function fromMetered(domain, key) {
  const host = String(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const r = await fetch(`https://${host}/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`);
  if (!r.ok) throw new Error('metered ' + r.status);
  return usable(await r.json());
}

module.exports = async (req, res) => {
  const env = process.env;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  let iceServers = [], provider = null, error = null;
  try {
    if (env.CLOUDFLARE_TURN_KEY_ID && env.CLOUDFLARE_TURN_API_TOKEN) { provider = 'cloudflare'; iceServers = await fromCloudflare(env.CLOUDFLARE_TURN_KEY_ID, env.CLOUDFLARE_TURN_API_TOKEN); }
    else if (env.METERED_DOMAIN && env.METERED_API_KEY) { provider = 'metered'; iceServers = await fromMetered(env.METERED_DOMAIN, env.METERED_API_KEY); }
  } catch (e) { error = 'The relay provider did not answer (' + e.message + ').'; iceServers = []; }
  res.statusCode = 200;
  res.end(JSON.stringify({ iceServers, provider, configured: !!provider, error, ttl: TTL }));
};
