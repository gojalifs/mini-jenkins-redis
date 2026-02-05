import os from 'os';
import path from 'path';

/**
 * Cross-platform path configuration
 */
const BASE_DIR = path.join(os.tmpdir(), 'mini-jenkins');

export const PATHS = {
  WORKSPACE_BASE: path.join(BASE_DIR, 'workspaces'),
  ARTIFACT_BASE: path.join(BASE_DIR, 'artifacts'),
  LOG_BASE: path.join(BASE_DIR, 'logs'),
  DEPLOY_BASE: path.join(BASE_DIR, 'deploy'),
  GIT_BASE: path.join(process.cwd(), 'git', 'projects')
};

/**
 * Get workspace path for a build
 */
export function getWorkspacePath(buildId) {
  return path.join(PATHS.WORKSPACE_BASE, `build-${buildId}`);
}

/**
 * Get artifact path
 */
export function getArtifactPath(repo, buildId) {
  return path.join(PATHS.ARTIFACT_BASE, repo, `app-${buildId}.tar.gz`);
}

/**
 * Get log file path
 */
export function getLogPath(buildId) {
  return path.join(PATHS.LOG_BASE, `build-${buildId}.log`);
}

/**
 * Get deployment paths
 */
export function getDeployPaths(repo, buildId) {
  const deployDir = path.join(PATHS.DEPLOY_BASE, repo);
  return {
    deployDir,
    releasesDir: path.join(deployDir, 'releases'),
    releaseDir: path.join(deployDir, 'releases', buildId),
    currentLink: path.join(deployDir, 'current')
  };
}

/**
 * Get git repository path
 */
export function getGitRepoPath(repo) {
  return path.join(PATHS.GIT_BASE, `${repo}.git`);
}
