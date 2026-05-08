/**
 * ToolVera – Secure Backend Proxy Server
 * ========================================
 * - Remove.bg API key lives ONLY in .env (never in frontend)
 * - Images processed entirely in RAM (Buffer) — nothing written to disk
 * - Rate limiting per IP (20 req/hour)
 * - CORS locked to toolvera.in in production
 * - Run: node server.js   OR   npm start
 *
 * Deployment options:
 *  · VPS/Droplet: pm2 start server.js --name toolvera
 *  · Render.com:  add as Web Service, set env vars in dashboard
 *  · Railway.app: connect repo, set REMOVEBG_API_KEY in env vars
 *  · Vercel:      rename to api/removebg.js (see bottom of file)
 */

require('dotenv').config();
const express    = require('express');
const multer     = require('multer');
const fetch      = require('node-fetch');
const FormData   = require('form-data');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? ['https://toolvera.in', 'https://www.toolvera.in']
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'];

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, Postman during dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: Origin not allowed'));
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Rate limiter: 20 requests per hour per IP ─────────────────────────────────
const limiter = rateLimit({
  windowMs : 60 * 60 * 1000, // 1 hour
  max      : 20,
  message  : { error: 'Too many requests. You can process 20 images per hour. Please try again later.' },
  standardHeaders: true,
  legacyHeaders  : false,
  keyGenerator   : (req) => req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
});

// ── Multer: store uploads in RAM only, never on disk ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),          // ← key: RAM buffer, no disk writes
  limits : { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    const ext     = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ['heic', 'heif'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FORMAT'));
    }
  },
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ToolVera API', ts: Date.now() });
});

// ── POST /api/removebg ────────────────────────────────────────────────────────
app.post('/api/removebg', limiter, upload.single('image'), async (req, res) => {
  // 1. Ensure an image was provided
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided. Please upload a valid image file.' });
  }

  // 2. Validate the API key is configured
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    console.error('[ToolVera] REMOVEBG_API_KEY is not set in environment variables!');
    return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
  }

  // 3. Build multipart form for Remove.bg — using the in-RAM buffer
  const form = new FormData();
  form.append('image_file', req.file.buffer, {
    filename    : req.file.originalname || 'upload.png',
    contentType : req.file.mimetype,
  });
  form.append('size',       'auto');  // HD output automatically chosen
  form.append('format',     'png');   // always return transparent PNG
  form.append('add_shadow', 'false');

  try {
    // 4. Call Remove.bg API — API key never leaves the server
    const bgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method  : 'POST',
      headers : {
        'X-Api-Key': apiKey,
        ...form.getHeaders(),
      },
      body: form,
    });

    // 5. Handle Remove.bg errors
    if (!bgRes.ok) {
      const errBody = await bgRes.text().catch(() => '');
      console.error(`[ToolVera] Remove.bg error ${bgRes.status}:`, errBody);

      const messages = {
        400: 'Image could not be processed. Try a higher-quality photo with a clearer subject.',
        402: 'API credits exhausted. Please contact support.',
        403: 'API authentication failed. Please contact support.',
        429: 'Remove.bg rate limit reached. Please wait a moment and try again.',
      };
      return res.status(bgRes.status).json({
        error: messages[bgRes.status] || `Processing failed (code ${bgRes.status}). Please try again.`,
      });
    }

    // 6. Read result into RAM buffer (never touches disk)
    const resultBuffer = await bgRes.buffer();
    const creditsUsed  = bgRes.headers.get('x-credits-charged') || '1';

    // 7. Log in memory — no disk, no database
    if (app._pushLog) {
      app._pushLog({
        success  : true,
        time     : Date.now(),
        ip,
        fileName : req.file.originalname || 'upload',
        fileSize : req.file.size,
        mimeType : req.file.mimetype,
        credits  : parseFloat(creditsUsed),
      });
    }

    // 8. Return result as base64 — browser downloads directly, buffer GC'd after this
    return res.status(200).json({
      success    : true,
      image      : resultBuffer.toString('base64'),
      mimeType   : 'image/png',
      outputSize : resultBuffer.length,
      creditsUsed: parseFloat(creditsUsed),
    });

  } catch (err) {
    if (app._pushLog) {
      app._pushLog({ success: false, time: Date.now(), ip, fileName: req.file?.originalname || '?', fileSize: req.file?.size || 0, mimeType: req.file?.mimetype || '?', credits: 0 });
    }
    console.error('[ToolVera] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  }
});

// ── In-memory request log (max 200 entries, resets on server restart) ─────────
const requestLog = [];
const logStats   = { totalRequests: 0, totalSuccess: 0, totalCredits: 0 };

// Inject logging into the removeBg handler by patching res.json
app.use('/api/removebg', (req, _res, next) => {
  req._logTime = Date.now();
  next();
});

// Middleware to capture log entries (attached after removeBg processes)
function pushLog(entry) {
  requestLog.unshift(entry);          // newest first
  if (requestLog.length > 200) requestLog.pop(); // cap at 200
  logStats.totalRequests++;
  if (entry.success) logStats.totalSuccess++;
  logStats.totalCredits += entry.credits || 0;
}

// Monkey-patch: re-export pushLog so removeBg can call it
app._pushLog = pushLog;

// ── GET /api/admin?token=xxx ──────────────────────────────────────────────────
app.get('/api/admin', (req, res) => {
  const { token } = req.query;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || token !== adminPass) {
    return res.status(401).json({ error: 'Unauthorized — wrong password' });
  }
  return res.status(200).json({ success: true, stats: logStats, log: requestLog });
});

// ── POST /api/admin/clear?token=xxx ──────────────────────────────────────────
app.post('/api/admin/clear', (req, res) => {
  const token     = req.query.token || req.body?.token;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || token !== adminPass) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  requestLog.length          = 0;
  logStats.totalRequests     = 0;
  logStats.totalSuccess      = 0;
  logStats.totalCredits      = 0;
  return res.status(200).json({ success: true });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum allowed size is 20MB.' });
  }
  if (err.message === 'INVALID_FORMAT') {
    return res.status(400).json({ error: 'Unsupported format. Please upload PNG, JPG, WEBP, or HEIC.' });
  }
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS: Request origin not allowed.' });
  }
  console.error('[ToolVera] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ ToolVera API running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/removebg`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   API Key: ${process.env.REMOVEBG_API_KEY ? '✅ Loaded from .env' : '❌ NOT SET — add REMOVEBG_API_KEY to .env'}\n`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERCEL SERVERLESS EXPORT (optional — rename this file to api/removebg.js)
// ═══════════════════════════════════════════════════════════════════════════════
// module.exports = app;
