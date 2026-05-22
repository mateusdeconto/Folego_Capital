import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import express from 'express';
import helmet from 'helmet';
import diagnoseRouter from './routes/diagnose.js';
import chatRouter from './routes/chat.js';
import emailRouter from './routes/email.js';
import macroRouter from './routes/macro.js';
import unsubscribeRouter from './routes/unsubscribe.js';
import { startMonthlyCron } from './lib/monthlyCron.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.2,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Detecta produção:
//  - NODE_ENV === 'production', OU
//  - existe a pasta frontend/dist (built)
const distPath = join(__dirname, '..', 'frontend', 'dist');
const distExists = existsSync(join(distPath, 'index.html'));
const isProd = process.env.NODE_ENV === 'production' || distExists;

console.log(`[boot] NODE_ENV=${process.env.NODE_ENV || '(not set)'}`);
console.log(`[boot] dist/index.html exists: ${distExists} (${distPath})`);
console.log(`[boot] mode: ${isProd ? 'PROD (serving frontend)' : 'DEV (api only)'}`);
try {
  const assetFiles = existsSync(join(distPath, 'assets'))
    ? readdirSync(join(distPath, 'assets')).slice(0, 10).join(', ')
    : '(assets dir missing)';
  console.log(`[boot] assets: ${assetFiles}`);
} catch (e) {
  console.log(`[boot] assets error: ${e.message}`);
}

if (isProd && !distExists) {
  console.error('❌ NODE_ENV=production mas frontend/dist/index.html não existe.');
  console.error('   Rode "npm run build" na raiz antes de iniciar o servidor.');
  console.error('   No Railway: confirme que railway.json tem buildCommand correto.');
  // Não sai — deixa o backend rodar pra API funcionar mesmo sem frontend
}

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Em produção: definir ALLOWED_ORIGINS=https://seu-dominio.com no Railway.
// Em dev local (5173 → 3001): ALLOWED_ORIGINS=http://localhost:5173
// Sem ALLOWED_ORIGINS em prod → apenas same-origin (origin === ownOrigin) é permitido.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

app.use('/api', (req, res, next) => {
  const origin = req.get('Origin');
  if (!origin) return next(); // sem Origin → same-origin implícito ou non-browser

  // Permite se: lista inclui '*', lista inclui origin, ou origin == host próprio (Railway same-origin)
  const proto = req.protocol || 'https';
  const ownOrigin = `${proto}://${req.get('host')}`;
  const allowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin === ownOrigin;

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
    return next();
  }

  console.warn('[cors] bloqueado:', origin, '≠', ownOrigin);
  return res.status(403).json({ error: 'CORS: origem não permitida.' });
});

app.use(express.json({ limit: '50kb' }));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY não encontrada. Servidor não vai subir.');
  process.exit(1);
}

// API
app.use('/api/diagnose', diagnoseRouter);
app.use('/api/chat', chatRouter);
app.use('/api/send-report', emailRouter);
app.use('/api/macro', macroRouter);
app.use('/api/unsubscribe', unsubscribeRouter);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mode: isProd ? 'prod' : 'dev',
    distExists,
  });
});


// Frontend estático em prod
if (distExists) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // Força MIME types corretos — Railway/Nixpacks às vezes não detecta automaticamente
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }

      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // CRÍTICO: assets que não existem devem retornar 404 limpo (nunca o index.html
  // como fallback — isso quebra MIME-type checking no navegador).
  app.get('/assets/*', (_req, res) => {
    res.status(404).type('text/plain').send('Asset not found');
  });

  // SPA fallback — apenas para navegação humana (rotas que não casam nada acima).
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error('[sendFile error]', err.message);
        res.status(500).type('text/plain').send('Erro ao carregar a aplicação.');
      }
    });
  });
} else {
  // Sem dist em prod → resposta clara em vez de erro confuso
  app.get('/', (_req, res) => {
    res.status(503).type('text/html').send(`
      <h1>Fôlego Capital — frontend não disponível</h1>
      <p>O backend está rodando mas o frontend ainda não foi buildado.</p>
      <p>Confira <a href="/api/health">/api/health</a> pra ver o status.</p>
    `);
  });
}

// Error handler — última linha de defesa
app.use((err, req, res, _next) => {
  Sentry.captureException(err, { extra: { method: req.method, path: req.path } });
  console.error('[unhandled]', req.method, req.path, '→', err.message);
  if (res.headersSent) return;
  // Pra requests de assets, retorna texto puro (evita o problema de MIME hoje)
  if (req.path.startsWith('/assets/')) {
    return res.status(500).type('text/plain').send('Asset error');
  }
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅ Fôlego Capital rodando em http://localhost:${PORT} [${isProd ? 'prod' : 'dev'}]`);
  if (process.env.BREVO_API_KEY) {
    startMonthlyCron();
  } else {
    console.warn('[cron] BREVO_API_KEY não configurada — cron mensal desativado');
  }
});
