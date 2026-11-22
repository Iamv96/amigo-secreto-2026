import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { initDb } from './server/db';
import authRouter from './server/routes/auth';
import giftsRouter from './server/routes/gifts';
import productMetaRouter from './server/routes/productMeta';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Error handling for malformed JSON
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
      return res.status(400).json({ error: 'Payload JSON malformado' });
    }
    next(err);
  });

  // Health check endpoint for Render
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'amigo-secreto-2026', timestamp: new Date().toISOString() });
  });

  // Initialize database / tables / seed
  await initDb();

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api', giftsRouter);
  app.use('/api', productMetaRouter);

  // Global API error handler
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err?.message || 'Error interno del servidor' });
  });

  // Frontend serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`🎄 Entorno de desarrollo activo con Vite middleware en http://localhost:${PORT}`);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`🎅 Servidor en producción listo en puerto ${PORT}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎁 Servidor de Amigo Secreto Navidad 2026 corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
