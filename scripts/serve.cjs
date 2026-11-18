const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PUBLIC = path.resolve(__dirname, '../public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

function createServer() {
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end('Method not allowed');
      return;
    }
    let filename;
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      filename = path.resolve(
        PUBLIC,
        '.' + (pathname === '/' ? '/index.html' : pathname),
      );
    } catch {
      res.writeHead(400);
      res.end('Invalid request');
      return;
    }
    if (!filename.startsWith(PUBLIC + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const content = await fs.readFile(filename);
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filename)] || 'application/octet-stream',
        'Content-Length': content.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const server = createServer();
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Psat Curve Lab: http://127.0.0.1:${port}`);
  });
}

module.exports = { createServer };
