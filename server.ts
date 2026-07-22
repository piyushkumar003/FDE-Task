import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus AI Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
