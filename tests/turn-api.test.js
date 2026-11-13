// Unit tests for api/turn.js (the relay-credentials function) with the providers' APIs faked.
// Run: node tests/turn-api.test.js
const path = require('path');
const handler = require(path.join(__dirname, '..', 'api', 'turn.js'));
let failed = 0, passed = 0;
const check = (name, ok, info = '') => { if (ok) passed++; else failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
async function call(env, fake) {
  const keep = { ...process.env };
  for (const k of ['CLOUDFLARE_TURN_KEY_ID', 'CLOUDFLARE_TURN_API_TOKEN', 'METERED_DOMAIN', 'METERED_API_KEY']) delete process.env[k];
  Object.assign(process.env, env);
  const calls = []; global.fetch = async (url, opt) => { calls.push({ url, opt }); return fake(url, opt); };
  const res = { headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = JSON.parse(b); } };
  await handler({ method: 'GET' }, res);
  process.env = keep;
  return { res, calls };
}
const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
(async () => {
  {
    const { res } = await call({}, () => { throw new Error('should not be called'); });
    check('not configured: empty list, no error', res.body.configured === false && res.body.iceServers.length === 0 && !res.body.error);
    check('never cached', res.headers['cache-control'] === 'no-store');
  }
  {
    const { res, calls } = await call({ CLOUDFLARE_TURN_KEY_ID: 'key123', CLOUDFLARE_TURN_API_TOKEN: 'tok456' }, () => json(201, { iceServers: [
      { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
      { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' }] }));
    const c = calls[0];
    check('cloudflare: correct endpoint and method', c.url === 'https://rtc.live.cloudflare.com/v1/turn/keys/key123/credentials/generate-ice-servers' && c.opt.method === 'POST', c.url);
    check('cloudflare: bearer token sent, ttl in body', c.opt.headers.Authorization === 'Bearer tok456' && JSON.parse(c.opt.body).ttl > 0);
    const urls = res.body.iceServers.flatMap(s => s.urls);
    check('cloudflare: port 53 addresses removed', !urls.some(u => /:53(\?|$)/.test(u)) && urls.length === 3, urls.join(' '));
    check('cloudflare: relay credentials passed through', res.body.iceServers[1].username === 'u' && res.body.iceServers[1].credential === 'c');
    check('cloudflare: secret token not in the response', !JSON.stringify(res.body).includes('tok456'));
  }
  {
    const { res, calls } = await call({ METERED_DOMAIN: 'https://tankteam.metered.live/', METERED_API_KEY: 'mk' }, () => json(200, [{ urls: 'turn:a.relay.metered.ca:80', username: 'x', credential: 'y' }]));
    check('metered: correct endpoint', calls[0].url === 'https://tankteam.metered.live/api/v1/turn/credentials?apiKey=mk', calls[0].url);
    check('metered: servers returned', res.body.provider === 'metered' && res.body.iceServers[0].urls[0] === 'turn:a.relay.metered.ca:80');
  }
  {
    const { res } = await call({ CLOUDFLARE_TURN_KEY_ID: 'k', CLOUDFLARE_TURN_API_TOKEN: 'bad' }, () => json(401, {}));
    check('provider error: game still gets an answer (empty list + reason)', res.body.iceServers.length === 0 && /401/.test(res.body.error));
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
