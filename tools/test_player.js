// Plays the browser player headlessly and checks controls + audio sync.
// Usage: node tools/test_player.js [url]   (default: served project/index.html)
const { chromium } = require('playwright-core');
const { start } = require('./serve');
(async () => {
  let srv = null, url = process.argv[2];
  if (!url) { srv = await start(8850); url = 'http://localhost:8850/index.html'; }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  const st = () => page.evaluate(() => ({ audioT: +document.getElementById('audio').currentTime.toFixed(3), paused: document.getElementById('audio').paused, muted: document.getElementById('audio').muted, scrub: +(+document.getElementById('scrub').value).toFixed(3), label: document.getElementById('time').textContent, dur: document.getElementById('audio').duration }));
  const res = [];
  await page.click('#overlay');                       // play
  await page.waitForTimeout(2500);
  let s = await st(); res.push(['play 2.5 s', s, !s.paused && s.audioT > 2 && Math.abs(s.audioT - s.scrub) < 0.1]);
  const drifts = [];
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(300); const q = await st(); drifts.push(Math.abs(q.audioT - q.scrub)); }
  res.push(['max |audio − picture| over 3 s (s)', Math.max(...drifts).toFixed(3), Math.max(...drifts) < 0.1]);
  await page.click('#mute'); s = await st(); res.push(['mute', s.muted, s.muted === true]);
  await page.click('#mute'); s = await st(); res.push(['unmute', s.muted, s.muted === false]);
  await page.click('#play'); await page.waitForTimeout(300); s = await st(); res.push(['pause', s.paused, s.paused]);
  await page.$eval('#scrub', (el) => { el.value = 30; el.dispatchEvent(new Event('input')); }); await page.waitForTimeout(200);
  s = await st(); res.push(['scrub to 30 s', s.audioT, Math.abs(s.audioT - 30) < 0.05 && s.label.startsWith('0:30')]);
  await page.click('#play'); await page.waitForTimeout(1000); s = await st(); res.push(['resume from 30 s', s.audioT, s.audioT > 30.5 && !s.paused]);
  await page.click('#restart'); await page.waitForTimeout(600); s = await st(); res.push(['restart', s.audioT, s.audioT < 1.0 && !s.paused]);
  await page.keyboard.press('Space'); await page.waitForTimeout(200); s = await st(); res.push(['space = pause', s.paused, s.paused]);
  res.push(['audio duration (s)', s.dur, Math.abs(s.dur - 54) < 0.2]);
  res.push(['page errors', errors.length ? errors.join('; ') : 'none', errors.length === 0]);
  await browser.close(); if (srv) srv.close();
  res.forEach(([k, v, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}: ${JSON.stringify(v)}`));
  process.exit(res.every((r) => r[2]) ? 0 : 1);
})();
