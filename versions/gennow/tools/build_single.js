// Build export/player.html: one self-contained file (fonts, audio, code inlined).
const fs = require('fs'), path = require('path');
const P = path.resolve(__dirname, '..', 'project');
const out = path.resolve(__dirname, '..', 'export', 'player.html');
let html = fs.readFileSync(path.join(P, 'index.html'), 'utf8');
// fonts -> data URIs
let css = fs.readFileSync(path.join(P, 'assets/fonts/fonts.css'), 'utf8');
css = css.replace(/url\('([^']+\.woff2)'\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(P, 'assets/fonts', f)).toString('base64')})`);
html = html.replace('<link rel="stylesheet" href="assets/fonts/fonts.css">', `<style>\n${css}\n</style>`);
// scripts inline
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n/* ${f} */\n${fs.readFileSync(path.join(P, f), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
// audio inline
const mp3 = fs.readFileSync(path.join(P, 'assets/audio/mix.mp3')).toString('base64');
html = html.replace('src="assets/audio/mix.mp3"', `src="data:audio/mpeg;base64,${mp3}"`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(2), 'MB');
