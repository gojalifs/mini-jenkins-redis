import express from 'express';

/**
 * Get all builds
 */
export async function getBuilds(req, res) {
  // TODO: Query from database
  res.json({ builds: [] });
}

/**
 * Get build by ID
 */
export async function getBuildById(req, res) {
  const { id } = req.params;
  // TODO: Query from database
  res.json({ build: { id, status: 'pending' } });
}

/**
 * Retry a failed build
 */
export async function retryBuild(req, res) {
  const { id } = req.params;
  // TODO: Re-enqueue build
  res.json({ success: true, message: 'Build retried' });
}
