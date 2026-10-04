const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { handleApiRequest } = require('./api');
const { cleanExpiredSessions } = require('./auth');
const { seedDatabase } = require('./seed');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// MIME Types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.csv': 'text/csv; charset=utf-8'
};

// Parse cookies helper
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Serve static file
function serveStatic(res, filePath, req) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // For HTML files, inject APP_URL environment variable and replace localhost origins
    if (ext === '.html') {
      fs.readFile(filePath, 'utf-8', (readErr, data) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Error reading HTML file');
        }
        // Determine base URL: use APP_URL env var if set, otherwise fallback to request origin
        const host = (req && req.headers && req.headers.host) ? req.headers.host : `localhost:${PORT}`;
        const baseUrl = process.env.APP_URL || `http://${host}`;
        // Replace occurrences of window.location.origin in the HTML/JS
        const modified = data.replace(/window\.location\.origin/g, baseUrl);
        // Also expose a global variable for any scripts that may use APP_URL directly
        const injection = `<script>window.APP_URL = "${baseUrl}";</script>`;
        const finalHtml = modified.replace('</head>', `${injection}</head>`);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': Buffer.byteLength(finalHtml),
          'Cache-Control': 'no-cache'
        });
        res.end(finalHtml);
      });
    } else {
      // Non-HTML files served as before
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  });
}

// Initialize and Seed Database if needed
seedDatabase();

// Clean expired sessions periodically
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

const server = http.createServer((req, res) => {
  // CORS & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Parse Body for POST/PUT
  let bodyBuffer = [];
  req.on('data', chunk => bodyBuffer.push(chunk));
  req.on('end', () => {
    let parsedBody = null;
    if (bodyBuffer.length > 0) {
      const rawBody = Buffer.concat(bodyBuffer).toString('utf-8');
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        parsedBody = Object.fromEntries(new URLSearchParams(rawBody));
      }
    }

    const cookies = parseCookies(req.headers.cookie);

    // Route: API Endpoints
    if (pathname.startsWith('/api/')) {
      return handleApiRequest(req, res, parsedUrl, parsedBody, cookies);
    }

    // Route: Uploaded files (/uploads/...)
    if (pathname.startsWith('/uploads/')) {
      const uploadFile = path.join(UPLOADS_DIR, pathname.replace('/uploads/', ''));
      return serveStatic(res, uploadFile, req);
    }

    // Route: Verification Page route /verify/:id
    if (pathname.startsWith('/verify/')) {
      const verifyHtmlPath = path.join(PUBLIC_DIR, 'verify.html');
      return serveStatic(res, verifyHtmlPath, req);
    }

    // Route: Admin SPA route
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      // If requesting an actual admin asset (e.g. /admin/admin.js or /admin/admin.css)
      const requestedAdminPath = path.join(PUBLIC_DIR, pathname);
      if (fs.existsSync(requestedAdminPath) && fs.statSync(requestedAdminPath).isFile()) {
        return serveStatic(res, requestedAdminPath, req);
      }
      // Otherwise serve admin/index.html SPA
      return serveStatic(res, path.join(PUBLIC_DIR, 'admin', 'index.html'), req);
    }

    // Route: Static files from public/
    let localPath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // If file exists, serve it
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      return serveStatic(res, localPath, req);
    }

    // Fallback to index.html for client-side routing
    const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      return serveStatic(res, fallbackPath, req);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`4S HERO – Waste Segregation Challenge Web Application`);
  console.log(`Malkajgiri Municipal Corporation (MMC), Telangana`);
      const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      console.log(`Server running at: ${baseUrl}`);
      console.log(`Public App:        ${baseUrl}/`);
      console.log(`Admin Portal:      ${baseUrl}/admin`);
  console.log(`====================================================`);
});
