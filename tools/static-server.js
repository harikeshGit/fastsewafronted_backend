#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { root: process.cwd(), host: '127.0.0.1', port: 8080 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--port') args.port = Number(argv[++i]);
  }
  return args;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const { root, host, port } = parseArgs(process.argv);
const resolvedRoot = path.resolve(root);

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const joined = path.resolve(base, '.' + decoded);
  if (!joined.startsWith(base)) return null;
  return joined;
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => send(res, 500, 'Internal Server Error'));
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const targetPath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = safeJoin(resolvedRoot, targetPath);
  if (!fullPath) return send(res, 400, 'Bad Request');

  fs.stat(fullPath, (err, stat) => {
    if (err) return send(res, 404, 'Not Found');

    if (stat.isDirectory()) {
      const indexPath = path.join(fullPath, 'index.html');
      fs.stat(indexPath, (indexErr, indexStat) => {
        if (indexErr || !indexStat.isFile()) return send(res, 403, 'Forbidden');
        return serveFile(res, indexPath);
      });
      return;
    }

    if (!stat.isFile()) return send(res, 403, 'Forbidden');
    return serveFile(res, fullPath);
  });
});

server.listen(port, host, () => {
  process.stdout.write(`Static server running at http://${host}:${port}\n`);
  process.stdout.write(`Serving: ${resolvedRoot}\n`);
});
