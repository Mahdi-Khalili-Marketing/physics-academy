const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 3005,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('پلتفرم در حال راه‌اندازی روی پورت ۳۰۰۵ است...');
  });
});

server.listen(3000, () => {
  console.log('Forwarding localhost:3000 -> localhost:3005');
});
