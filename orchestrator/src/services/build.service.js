import { enqueueBuild, getJobById, getAllJobs } from '../core/queue.js';

/**
 * Create and enqueue a build
 */
export async function createBuild({ repo, commit, ref }) {
  const buildId = await enqueueBuild({ repo, commit, ref });

  const build = {
    id: buildId,
    repo,
    commit,
    ref,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  return build;
}

/**
 * Get build status
 */
export async function getBuildStatus(buildId) {
  const job = getJobById(buildId);
  return job || { id: buildId, status: 'unknown' };
}

/**
 * List all builds
 */
export async function listBuilds(filters = {}) {
  return getAllJobs(filters.limit || 50);
}
