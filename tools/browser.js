// Shared: launch headless Chromium on the served project page in export mode.
const { chromium } = require('playwright-core');
const fs = require('fs');
const { start } = require('./serve');
async function open(port = 8765) {
  const srv = await start(port);
  const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--disable-web-security', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://localhost:${port}/index.html?export`);
  await page.evaluate(() => window.__ready);
  const close = async () => { await browser.close(); srv.close(); };
  return { page, close };
}
/** Render time t and return PNG buffer of the 1080×1920 canvas. */
async function frame(page, t, type = 'image/png', q = 0.92) {
  const url = await page.evaluate(([tt, ty, qq]) => { window.__render(tt); return document.getElementById('c').toDataURL(ty, qq); }, [t, type, q]);
  return Buffer.from(url.split(',')[1], 'base64');
}
module.exports = { open, frame };
