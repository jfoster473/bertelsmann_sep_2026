// Frame-accurate export: headless Chromium steps time (no real-time capture),
// pipes PNG frames into ffmpeg, muxes the mastered audio -> H.264/AAC MP4.
// Usage: node tools/export.js [out.mp4] [--from s --to s] [--crf 18]
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { open, frame } = require('./browser');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(ROOT, 'export', 'video.mp4'));
const crf = opt('crf', '18');
const workers = +opt('workers', '3');

(async () => {
  const TL = require(path.join(ROOT, 'project/src/data/timeline.js'));
  const fps = TL.fps, dur = TL.duration;
  const from = +opt('from', 0), to = +opt('to', dur);
  const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const audio = path.join(ROOT, 'project/assets/audio/mix.wav');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-ss', String(from), '-t', String(to - from), '-i', audio,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-x264-params', 'keyint=60:min-keyint=30', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  // several browser pages render in parallel; frames are written in order
  const pages = await Promise.all([...Array(workers)].map((_, i) => open(8800 + i)));
  const t0 = Date.now();
  const pending = new Map();
  let next = f0, written = f0;
  const write = (buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r)));
  async function worker(w) {
    while (true) {
      const i = next++;
      if (i >= f1) return;
      const buf = await frame(pages[w].page, i / fps);
      pending.set(i, buf);
      while (pending.has(written)) {
        const b = pending.get(written); pending.delete(written);
        await write(b);
        written++;
        if (written % 60 === 0) process.stdout.write(`\r${written}/${f1} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      }
    }
  }
  await Promise.all(pages.map((_, w) => worker(w)));
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await Promise.all(pages.map((p) => p.close()));
  console.log(`\nwrote ${out} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
})();
