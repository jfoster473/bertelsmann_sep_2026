// Minimal static file server for the project (fonts need http:// to load).
// Usage: node tools/serve.js [port]   then open http://localhost:8080/
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', 'project');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json', '.png': 'image/png' };
function start(port = 8080) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
      const range = req.headers.range;
      const type = TYPES[path.extname(f)] || 'application/octet-stream';
      if (range) { // audio seeking needs byte ranges
        const [a, b] = range.replace('bytes=', '').split('-');
        const s = parseInt(a, 10), e = b ? parseInt(b, 10) : st.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 });
        return fs.createReadStream(f, { start: s, end: e }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(f).pipe(res);
    });
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}
module.exports = { start };
if (require.main === module) start(+process.argv[2] || 8080).then(() => console.log('Serving project/ on http://localhost:' + (+process.argv[2] || 8080)));
