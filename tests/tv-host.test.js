// Browser tests for offline play, Host & Play, and the display-only TV host with four phone controllers.
// Run: node tests/tv-host.test.js   (needs Playwright with Chromium; PeerJS is replaced by tests/fakepeer.js)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const PORT = 8830 + Math.floor(Math.random() * 100);
const turnApi = require(path.join(root, 'api', 'turn.js'));
const srv = http.createServer((q, r) => {
  if (q.url.split('?')[0] === '/api/turn') return turnApi(q, r); // the real function, as Vercel runs it (no relay keys set here)
  const f = path.join(root, q.url === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(root)) { r.statusCode = 403; return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', f.endsWith('.js') ? 'text/javascript' : 'text/html'); r.end(d); });
}).listen(PORT);
const URL = `http://localhost:${PORT}/`;
let failed = 0, passed = 0;
const check = (name, ok, info = '') => { if (ok) passed++; else failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
// on-screen controller helpers (pointer events, as a finger would send)
const ptr = (p, sel, type, dx, dy, id) => p.evaluate(([sel, type, dx, dy, id]) => { const el = document.querySelector(sel), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: r.left + r.width / 2 + dx, clientY: r.top + r.height / 2 + dy, bubbles: true, cancelable: true, pointerType: 'touch' })); }, [sel, type, dx, dy, id]);
const tap = async (p, sel) => { await ptr(p, sel, 'pointerdown', 0, 0, 9); await wait(130); await ptr(p, sel, 'pointerup', 0, 0, 9); await wait(200); };
const G = (p, fn, arg) => p.evaluate(fn, arg);
const state = p => G(p, () => RR_DEBUG.G.state);
const slots = p => G(p, () => RR_DEBUG.G.slots.map(s => s && s.dev));
async function until(fn, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(100); } return false; }

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const watch = (p, n) => { p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); }); return p; };

  // ---------- 1. offline play ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = watch(await ctx.newPage(), 'offline');
    await p.goto(URL + '#debug'); await wait(300);
    await p.keyboard.press('Space'); await wait(150);
    check('offline: keyboard joins P1', (await slots(p))[0] === 'kb');
    await p.keyboard.press('Enter'); await wait(300);
    check('offline: game starts', ['intro', 'play'].includes(await state(p)));
    await ctx.close();
  }

  // ---------- 2. Host & Play ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript({ path: path.join(__dirname, 'fakepeer.js') });
    const h = watch(await ctx.newPage(), 'host&play');
    await h.goto(URL + '#debug'); await wait(300);
    await h.click('#net-btn'); await h.click('#net-host');
    await h.waitForFunction(() => document.querySelector('#net-room').textContent.length === 5);
    const code = await h.textContent('#net-room'); await h.click('#net-close');
    await h.keyboard.press('Space'); await wait(200);
    const ph = watch(await ctx.newPage(), 'h&p-phone'); await ph.goto(URL + '#pad=' + code); await ph.setViewportSize({ width: 844, height: 390 });
    await until(async () => (await ph.textContent('#pad-title')).startsWith('Room'));
    await tap(ph, '#t-a'); await wait(300);
    const sl = await slots(h);
    check('host & play: host keyboard is P1, phone is P2', sl[0] === 'kb' && /^r:.+:pad9$/.test(sl[1] || ''), JSON.stringify(sl));
    check('host & play: host is not in TV mode', !(await h.evaluate(() => document.body.classList.contains('display'))));
    await ctx.close();
  }

  // ---------- 2b. internet relay (TURN) ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript({ path: path.join(__dirname, 'fakepeer.js') });
    await ctx.addInitScript(() => { const P = window.Peer; window.__peerOpts = []; window.Peer = class extends P { constructor(a, o) { super(a, o); window.__peerOpts.push(typeof a === 'object' ? a : o); } }; });
    await ctx.route('**/api/turn', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: true, iceServers: [{ urls: ['turn:relay.example:3478?transport=udp'], username: 'u', credential: 'c' }] }) }));
    const h = watch(await ctx.newPage(), 'relay-host');
    await h.goto(URL + '#debug'); await wait(300);
    await h.click('#net-btn');
    check('relay: panel says the internet relay is on', await until(async () => /relay on/i.test(await h.textContent('#net-relay'))));
    await h.click('#net-host'); await h.waitForFunction(() => document.querySelector('#net-room').textContent.length === 5);
    const code = await h.textContent('#net-room');
    const ph = watch(await ctx.newPage(), 'relay-phone'); await ph.goto(URL + '#pad=' + code);
    await until(async () => (await ph.textContent('#pad-title')).startsWith('Room'));
    const hostIce = await h.evaluate(() => JSON.stringify(window.__peerOpts[0].config.iceServers)), phIce = await ph.evaluate(() => JSON.stringify(window.__peerOpts[0].config.iceServers));
    check('relay: host and phone both connect with the relay servers', /relay\.example/.test(hostIce) && /relay\.example/.test(phIce) && /stun:/.test(hostIce));
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const h = watch(await ctx.newPage(), 'no-relay');
    await h.goto(URL); await wait(300); await h.click('#net-btn');
    check('no relay set up: panel says so (and play still works, see the tests below)', await until(async () => /not set up/i.test(await h.textContent('#net-relay'))));
    await ctx.close();
  }

  // ---------- 3+. display-only TV host with phones ----------
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true }); // iPad-like landscape with touch
  await ctx.addInitScript({ path: path.join(__dirname, 'fakepeer.js') });
  const tv = watch(await ctx.newPage(), 'tv');
  await tv.goto(URL + '#debug'); await wait(300);
  await tv.evaluate(() => document.dispatchEvent(new TouchEvent('touchstart'))).catch(() => {});
  await tv.click('#net-btn'); await tv.click('#net-host-tv');
  await until(() => tv.evaluate(() => document.body.classList.contains('display')));
  const code = await tv.evaluate(() => document.querySelector('.lobby .bigcode') && document.querySelector('.lobby .bigcode').textContent);
  check('TV: display mode on, lobby shows a 5-letter code', /^[A-Z0-9]{5}$/.test(code || ''), code);
  check('TV: lobby shows a QR code', await tv.evaluate(() => !!document.querySelector('.lobby .qrbig img')));
  check('TV: no on-screen controls', await tv.evaluate(() => getComputedStyle(document.querySelector('#touch')).display === 'none' || document.querySelector('#touch').hidden));
  await tv.keyboard.press('Space'); await tv.keyboard.press('Enter'); await tv.mouse.click(600, 400); await wait(300);
  check('TV: host keyboard/mouse cannot take a slot or start', (await slots(tv)).every(s => !s) && (await state(tv)) === 'title');
  await tv.screenshot({ path: path.join(__dirname, 'out-tv-lobby-empty.png') });

  const phones = [];
  for (let k = 0; k < 5; k++) {
    const p = watch(await ctx.newPage(), 'phone' + (k + 1));
    await p.goto(URL + '#pad=' + code); await p.setViewportSize({ width: 844, height: 390 });
    phones.push(p);
  }
  check('QR link: all 5 phones connect in controller mode', (await Promise.all(phones.map(p => until(async () => (await p.textContent('#pad-title')).startsWith('Room'))))).every(Boolean));
  for (let k = 0; k < 4; k++) { await phones[k].click('#padcust [data-pc="join"]'); await wait(150); }
  let sl = await slots(tv);
  const ids = await Promise.all(phones.slice(0, 4).map(p => p.evaluate(() => document.querySelector('#pad-title').textContent)));
  check('four phones get P1–P4, no duplicates', sl.every(Boolean) && new Set(sl).size === 4, JSON.stringify(ids));
  check('each phone shows its own player number', ids.join() === 'You are P1,You are P2,You are P3,You are P4', ids.join());
  await tap(phones[4], '#t-a'); await wait(300);
  check('fifth phone cannot take a slot or displace anyone', JSON.stringify(await slots(tv)) === JSON.stringify(sl));
  check('fifth phone is told the game is full', /full/i.test(await phones[4].textContent('#pad-msg')));
  await tap(phones[4], '#t-start'); await wait(300);
  check('fifth phone cannot start the game', (await state(tv)) === 'title');
  check('TV lobby says all 4 slots are full', await tv.evaluate(() => /All 4 player slots are full/.test(document.querySelector('#overlay').textContent)));
  await tv.screenshot({ path: path.join(__dirname, 'out-tv-lobby-full.png') });

  // phone garage in the TV lobby: preview, color, trail and tank picks reach the TV
  const P1 = phones[0];
  check('phone garage shows in the lobby', await P1.evaluate(() => document.body.classList.contains('cust') && !!document.querySelector('#pc-prev') && document.querySelectorAll('#padcust .sw').length > 5));
  check('controller sticks are hidden while in the garage', await P1.evaluate(() => getComputedStyle(document.querySelector('#touch')).display === 'none'));
  await P1.click('#padcust .sw[data-v="5"]'); await wait(250);
  await P1.click('#padcust .pchip[data-v="4"]'); await wait(250);
  const s0 = await G(tv, () => { const s = RR_DEBUG.G.slots[0]; return [s.color, s.trail, s.chassis]; });
  check('garage color and trail picks reach the TV', s0[0] === 5 && s0[1] === 4, JSON.stringify(s0));
  const locked = await P1.evaluate(() => [...document.querySelectorAll('#padcust .tk')].filter(b => b.disabled).length);
  check('locked tanks are shown but cannot be picked', locked > 0);
  const previewPainted = await P1.evaluate(() => { const c = document.querySelector('#pc-prev'), d = c.getContext('2d').getImageData(150, 150, 120, 60).data; let dark = 0; for (let k = 0; k < d.length; k += 4) if (d[k] < 90) dark++; return dark > 50; });
  check('tank preview is drawn', previewPainted);
  await P1.screenshot({ path: path.join(__dirname, 'out-phone-garage.png') });
  await P1.setViewportSize({ width: 390, height: 664 }); await wait(200);
  await P1.screenshot({ path: path.join(__dirname, 'out-phone-garage-portrait.png') });
  await P1.setViewportSize({ width: 844, height: 390 });

  // remote start, independent controls
  await phones[0].click('#padcust [data-pc="start"]');
  check('remote start from a phone', await until(async () => ['intro', 'play'].includes(await state(tv))));
  await until(async () => (await state(tv)) === 'play', 6000);
  await G(tv, () => { RR_DEBUG.G.tanks.forEach(t => { if (t.team === 'p') t.shield = 999; if (t.team === 'e') t.cool = 999; }); });
  const pos = () => G(tv, () => [0, 1, 2, 3].map(i => { const t = RR_DEBUG.G.tanks.find(t => t.team === 'p' && t.slot === i && !t.ally); return t ? [Math.round(t.x), Math.round(t.y)] : null; }));
  const before = await pos();
  await ptr(phones[2], '#t-move', 'pointerdown', 0, 0, 1); await ptr(phones[2], '#t-move', 'pointermove', 50, 0, 1); await wait(700);
  await ptr(phones[2], '#t-move', 'pointerup', 0, 0, 1);
  const after = await pos();
  const moved = after.map((a, i) => a && before[i] && Math.hypot(a[0] - before[i][0], a[1] - before[i][1]) > 20);
  check('only P3 moves when phone 3 steers', moved.join() === 'false,false,true,false', JSON.stringify([before, after]));
  await ptr(phones[1], '#t-aim', 'pointerdown', 0, 0, 2); await ptr(phones[1], '#t-aim', 'pointermove', 0, -50, 2); await wait(500);
  const shots = await G(tv, () => [...new Set(RR_DEBUG.G.bullets.filter(b => b.team === 'p').map(b => b.slot))]);
  await ptr(phones[1], '#t-aim', 'pointerup', 0, 0, 2);
  check('phone 2 fires as P2 only', shots.join() === '1', JSON.stringify(shots));
  await tv.screenshot({ path: path.join(__dirname, 'out-tv-play.png') });
  check('garage hides and controller shows once the game starts', await P1.evaluate(() => !document.body.classList.contains('cust') && getComputedStyle(document.querySelector('#touch')).display !== 'none'));
  // controller buttons never overlap or leave the screen (iPhone landscape, short Safari landscape, iPhone SE, portrait)
  for (const [w, h] of [[844, 390], [844, 320], [667, 325], [568, 300], [390, 664], [375, 560]]) {
    await P1.setViewportSize({ width: w, height: h }); await wait(120);
    const bad = await P1.evaluate(() => {
      const els = ['#t-a', '#t-b', '#t-start', '#t-lb', '#t-rb', '#t-mine'].map(q => [q, document.querySelector(q).getBoundingClientRect()]);
      const out = [];
      for (const [q, r] of els) if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) out.push(q + ' off-screen');
      for (let x = 0; x < els.length; x++) for (let y = x + 1; y < els.length; y++) { const [qa, a] = els[x], [qb, b] = els[y]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(qa + ' overlaps ' + qb); }
      const msg = document.querySelector('#pad-msg').getBoundingClientRect(), mine = document.querySelector('#t-mine').getBoundingClientRect();
      if (msg.bottom > mine.top && msg.right > mine.left && msg.left < mine.right) out.push('status text overlaps MINE');
      return out;
    });
    check(`phone controller layout ${w}×${h}: no overlaps`, bad.length === 0, bad.join(', '));
    if (w === 844 && h === 320) await P1.screenshot({ path: path.join(__dirname, 'out-phone-controller-short.png') });
  }
  await P1.setViewportSize({ width: 844, height: 390 });
  // a quick second tap is not allowed to zoom the page
  const blocked = await P1.evaluate(() => {
    const t = document.querySelector('#padui');
    const mk = () => new TouchEvent('touchend', { bubbles: true, cancelable: true });
    t.dispatchEvent(mk()); const e2 = mk(); t.dispatchEvent(e2); return e2.defaultPrevented;
  });
  check('double tap does not zoom (second quick tap is blocked)', blocked);
  check('page zoom is turned off in the viewport settings', await P1.evaluate(() => /user-scalable=no/.test(document.querySelector('meta[name=viewport]').content)));
  check('TV: no controls drawn over the game', await tv.evaluate(() => document.querySelector('#touch').hidden));

  // pause / resume from phones
  await tap(phones[3], '#t-start');
  check('remote pause', await until(async () => (await state(tv)) === 'paused'));
  await tap(phones[0], '#t-start');
  check('remote resume', await until(async () => (await state(tv)) === 'play'));

  // disconnect: phone 2 closes, the others keep playing
  await phones[1].evaluate(() => dispatchEvent(new Event('beforeunload'))); await phones[1].close();
  await wait(600);
  sl = await slots(tv);
  check('phone 2 disconnect frees only P2', !sl[1] && sl[0] && sl[2] && sl[3], JSON.stringify(sl));
  check('remaining players keep playing', (await state(tv)) === 'play');

  // quit to lobby, phone 2 comes back (same tab = same token) and gets P2 again
  await tap(phones[0], '#t-start'); await until(async () => (await state(tv)) === 'paused');
  await tap(phones[0], '#t-b');
  check('remote quit to lobby', await until(async () => (await state(tv)) === 'title'));
  const back = watch(await ctx.newPage(), 'phone2-again');
  await back.goto(URL + '#pad=' + code); await back.setViewportSize({ width: 844, height: 390 });
  check('reconnecting phone connects', await until(async () => (await back.textContent('#pad-title')).startsWith('Room')));
  await back.click('#padcust [data-pc="join"]'); await wait(300);
  sl = await slots(tv);
  check('reconnected phone takes the free slot, no duplicates', sl.every(Boolean) && new Set(sl).size === 4, JSON.stringify(sl));

  // same tab reconnecting while its old connection still looks alive: old one is replaced, never two slots
  const dupBefore = (await slots(tv)).filter(Boolean).length;
  await phones[2].reload(); await phones[2].setViewportSize({ width: 844, height: 390 });
  await until(async () => (await phones[2].textContent('#pad-title')).startsWith('Room'));
  await phones[2].click('#padcust [data-pc="join"]'); await wait(400);
  sl = await slots(tv);
  check('reloaded phone 3 gets P3 back (same slot), no duplicate', sl.filter(Boolean).length === dupBefore && /You are P3/.test(await phones[2].textContent('#pad-title')), JSON.stringify(sl));

  // a phone whose old connection still looks alive opens a new one (same tab token): the old one is dropped, never two slots
  const dup = await phones[3].evaluate(async ([code]) => {
    const tok = sessionStorage.getItem('rr-tab');
    const pr = new Peer(); await new Promise(r => pr.on('open', r));
    const c = pr.connect('ricochet-regiment-' + code); await new Promise(r => c.on('open', r));
    c.send({ t: 'hello', name: 'Ghost', tok });
    await new Promise(r => setTimeout(r, 300));
    c.send({ t: 'in', d: { pad9: { mx: 0, my: 0, c: {} } } });
    await new Promise(r => setTimeout(r, 100));
    c.send({ t: 'in', d: { pad9: { mx: 0, my: 0, c: { a: 1 } } } });
    await new Promise(r => setTimeout(r, 400));
    return pr.id;
  }, [code]);
  sl = await slots(tv);
  check('duplicate connection from the same phone replaces the old one (still 4 players, P4 kept)', sl.filter(Boolean).length === 4 && (sl[3] || '').startsWith('r:' + dup + ':'), JSON.stringify(sl));

  // restart after game over, all from phones
  await phones[0].click('#padcust [data-pc="start"]');
  await until(async () => (await state(tv)) === 'play', 6000);
  await G(tv, () => { const G = RR_DEBUG.G; G.lives = 1; G.tanks.forEach(t => { if (t.team === 'p') { t.shield = 0; t.alive = false; } }); });
  check('game over reached', await until(async () => (await state(tv)) === 'gameover', 6000));
  await tap(phones[3], '#t-a');
  check('remote return to lobby after game over', await until(async () => (await state(tv)) === 'title'));
  await phones[0].click('#padcust [data-pc="start"]');
  check('remote restart', await until(async () => ['intro', 'play'].includes(await state(tv))));

  // manual room code entry on a phone
  const manual = watch(await ctx.newPage(), 'manual'); await manual.setViewportSize({ width: 844, height: 390 });
  await manual.goto(URL); await wait(300);
  await manual.click('#net-btn'); await manual.fill('#net-code', code.toLowerCase()); await manual.click('#net-pad');
  check('manual code entry joins as controller', await until(async () => (await manual.textContent('#pad-title')).startsWith('Room')));

  // leaving TV mode restores the normal host
  await tv.evaluate(() => document.querySelector('#net-btn').click()); await tv.click('#net-leave'); await wait(300);
  check('leaving the room ends TV mode', !(await tv.evaluate(() => document.body.classList.contains('display'))));

  check('no page errors', errs.length === 0, errs.slice(0, 5).join(' | '));
  await b.close(); srv.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
