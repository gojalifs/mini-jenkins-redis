import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { executeBuild } from './executor.js';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

/**
 * Build worker - processes build jobs from queue
 */
export const buildWorker = new Worker(
  'builds',
  async (job) => {
    const { buildId, repo, commit, ref } = job.data;
    
    console.log(`[Worker] Starting build ${buildId}`);
    
    try {
      await executeBuild({ buildId, repo, commit, ref });
      console.log(`[Worker] Build ${buildId} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`[Worker] Build ${buildId} failed:`, error.message);
      throw error;
    }
  },
  { 
    connection,
    concurrency: 1 // Sequential builds (Phase 1)
  }
);

buildWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

buildWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed:`, err.message);
});
