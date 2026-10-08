import express from 'express';
import fs from 'fs';
import http from 'http';
import { AddressInfo } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OracleToolingConfig {
  oracleHome: string;
  frmf2xmlPath: string;
  frmxml2fPath: string;
  frmcmpBatchPath: string;
  detected: boolean;
  version: string;
}

let toolingConfig: OracleToolingConfig = {
  oracleHome: process.env.ORACLE_HOME || 'C:\\Oracle\\Middleware\\Oracle_Home',
  frmf2xmlPath:
    'C:\\Oracle\\Middleware\\Oracle_Home\\user_projects\\domains\\base_domain\\config\\fmwconfig\\components\\FORMS\\instances\\forms1\\bin\\frmf2xml.bat',
  frmxml2fPath:
    'C:\\Oracle\\Middleware\\Oracle_Home\\user_projects\\domains\\base_domain\\config\\fmwconfig\\components\\FORMS\\instances\\forms1\\bin\\frmxml2f.bat',
  frmcmpBatchPath:
    'C:\\Oracle\\Middleware\\Oracle_Home\\bin\\frmcmp_batch.exe',
  detected: Boolean(process.env.ORACLE_HOME),
  version: '12.2.1.4.0',
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint used by the Microsoft WebView2 desktop host
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      host: 'node-webview2',
      pid: process.pid,
    });
  });

  // Replace Electron IPC: Get Oracle Forms tooling configuration
  app.get('/api/tooling-config', (_req, res) => {
    const frmf2xmlExists = fs.existsSync(toolingConfig.frmf2xmlPath);
    res.json({
      ...toolingConfig,
      detected: frmf2xmlExists || toolingConfig.detected,
    });
  });

  // Replace Electron IPC: Update Oracle Forms tooling configuration
  app.post('/api/tooling-config', (req, res) => {
    if (req.body && typeof req.body === 'object') {
      toolingConfig = {
        ...toolingConfig,
        ...(req.body as Partial<OracleToolingConfig>),
      };
    }
    res.json(toolingConfig);
  });

  // Clean shutdown endpoint for WebView2 host window close
  app.post('/api/shutdown', (_req, res) => {
    res.json({ shuttingDown: true });
    setTimeout(() => process.exit(0), 50);
  });

  const isDesktopHost = process.env.WEBVIEW2_HOST === '1';
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (isDesktopHost && fs.existsSync(path.join(__dirname, 'dist', 'index.html')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // In WebView2 desktop mode, bind strictly to 127.0.0.1 and allow ephemeral port 0
  const requestedPort =
    process.env.PORT !== undefined
      ? Number(process.env.PORT)
      : isDesktopHost
      ? 0
      : 3000;
  const bindHost = isDesktopHost ? '127.0.0.1' : '0.0.0.0';

  const server = http.createServer(app);

  server.listen(requestedPort, bindHost, () => {
    const addr = server.address() as AddressInfo;
    const actualPort = addr.port;
    console.log(`FMB_SERVER_LISTENING=http://127.0.0.1:${actualPort}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('disconnect', shutdown);
}

startServer();
