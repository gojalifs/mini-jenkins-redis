import express from 'express';
import { handleWebhook } from './api/webhook.controller.js';
import { getBuilds, getBuildById, retryBuild } from './api/build.controller.js';
import { buildWorker } from './core/worker.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Routes
app.post('/webhook', handleWebhook);
app.get('/api/builds', getBuilds);
app.get('/api/builds/:id', getBuildById);
app.post('/api/builds/:id/retry', retryBuild);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Orchestrator running on http://localhost:${PORT}`);
  console.log('👷 Build worker started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await buildWorker.close();
  process.exit(0);
});
