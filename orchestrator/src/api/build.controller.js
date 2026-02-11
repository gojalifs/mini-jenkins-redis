import { getAllJobs, getJobById, retryJob } from '../core/queue.js';

/**
 * Get all builds
 */
export async function getBuilds(req, res) {
  const builds = getAllJobs(50);
  res.json({ builds });
}

/**
 * Get build by ID
 */
export async function getBuildById(req, res) {
  const { id } = req.params;
  const build = getJobById(id);

  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  res.json({ build });
}

/**
 * Retry a failed build
 */
export async function retryBuild(req, res) {
  const { id } = req.params;
  const success = retryJob(id);

  if (!success) {
    return res
      .status(400)
      .json({ error: 'Build not found or not in failed state' });
  }

  res.json({ success: true, message: 'Build retried' });
}
