import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getDeployPaths, getArtifactPath } from '../config/paths.js';

const execAsync = promisify(exec);

/**
 * Deploy an artifact atomically
 */
export async function deployArtifact({ repo, buildId }) {
  const { releaseDir, currentLink } = getDeployPaths(repo, buildId);
  
  // Ensure directories exist
  await fs.mkdir(releaseDir, { recursive: true });
  
  // Extract artifact
  const artifactPath = getArtifactPath(repo, buildId);
  await execAsync(`tar -xzf "${artifactPath}" -C "${releaseDir}"`);
  
  // Atomic symlink switch
  const tmpLink = `${currentLink}.tmp`;
  await fs.symlink(releaseDir, tmpLink);
  await fs.rename(tmpLink, currentLink);
  
  return { deployed: buildId, path: currentLink };
}

/**
 * Rollback to previous release
 */
export async function rollback({ repo, targetBuildId }) {
  const { releaseDir, currentLink } = getDeployPaths(repo, targetBuildId);
  
  // Verify target exists
  await fs.access(releaseDir);
  
  // Atomic symlink/junction switch (cross-platform)
  const tmpLink = `${currentLink}.tmp`;
  try {
    await fs.symlink(releaseDir, tmpLink, os.platform() === 'win32' ? 'junction' : 'dir');
  } catch (err) {
    await fs.writeFile(tmpLink, releaseDir, 'utf-8');
  }
  await fs.rename(tmpLink, currentLink);
  
  return { rolledBackTo: targetBuildId };
}

/**
 * List all releases
 */
export async function listReleases(repo) {
  const { releasesDir } = getDeployPaths(repo, null);
  
  try {
    const releases = await fs.readdir(releasesDir);
    return releases.sort().reverse(); // Newest first
  } catch (error) {
    return [];
  }
}
