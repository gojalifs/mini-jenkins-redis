import { getNextJob, completeJob } from './queue.js';
import { executeBuild } from './executor.js';

let isProcessing = false;
let workerInterval = null;

/**
 * Build worker - polls for and processes build jobs from SQLite queue
 */
async function processNextJob() {
  if (isProcessing) return;

  const job = getNextJob();
  if (!job) return;

  isProcessing = true;
  const { buildId, repo, commit, ref } = job;

  console.log(`[Worker] Starting build ${buildId}`);

  try {
    await executeBuild({ buildId, repo, commit, ref });
    console.log(`[Worker] Build ${buildId} completed successfully`);
    completeJob(buildId, true);
  } catch (error) {
    console.error(`[Worker] Build ${buildId} failed:`, error.message);
    completeJob(buildId, false, error.message);
  } finally {
    isProcessing = false;
    // Check for next job immediately
    setImmediate(processNextJob);
  }
}

/**
 * Start the worker polling loop
 */
export function startWorker(pollInterval = 2000) {
  console.log(`[Worker] Started (polling every ${pollInterval}ms)`);

  // Poll for new jobs
  workerInterval = setInterval(processNextJob, pollInterval);

  // Process any existing jobs immediately
  processNextJob();
}

/**
 * Stop the worker
 */
export function stopWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Worker] Stopped');
  }
}

// Export for compatibility
export const buildWorker = {
  start: startWorker,
  stop: stopWorker,
};
