import { enqueueBuild } from '../core/queue.js';

/**
 * Create and enqueue a build
 */
export async function createBuild({ repo, commit, ref }) {
  const buildId = await enqueueBuild({ repo, commit, ref });
  
  // TODO: Save to database
  const build = {
    id: buildId,
    repo,
    commit,
    ref,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  return build;
}

/**
 * Get build status
 */
export async function getBuildStatus(buildId) {
  // TODO: Query from database
  return {
    id: buildId,
    status: 'unknown'
  };
}

/**
 * List all builds
 */
export async function listBuilds(filters = {}) {
  // TODO: Query from database with filters
  return [];
}
