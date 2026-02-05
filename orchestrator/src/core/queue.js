import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

/**
 * Build job queue
 */
export const buildQueue = new Queue('builds', { connection });

/**
 * Enqueue a new build job
 * @param {Object} job - { repo, commit, ref }
 * @returns {Promise<string>} buildId
 */
export async function enqueueBuild(job) {
  const buildId = `${Date.now()}-${job.commit.substring(0, 7)}`;
  
  await buildQueue.add('build', {
    buildId,
    ...job
  });
  
  return buildId;
}

/**
 * Get queue status
 */
export async function getQueueStatus() {
  const waiting = await buildQueue.getWaitingCount();
  const active = await buildQueue.getActiveCount();
  const completed = await buildQueue.getCompletedCount();
  const failed = await buildQueue.getFailedCount();
  
  return { waiting, active, completed, failed };
}
