// Render stills: node tools/snap.js outdir t1 t2 ...
const fs = require('fs'), path = require('path');
const { open, frame } = require('./browser');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const { page, close } = await open(8770 + Math.floor(Math.random() * 100));
  for (const t of ts) fs.writeFileSync(path.join(out, `t${(+t).toFixed(2).padStart(6, '0')}.png`), await frame(page, +t));
  await close();
})();
