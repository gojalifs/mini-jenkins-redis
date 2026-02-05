import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { getWorkspacePath, getArtifactPath, getLogPath, getGitRepoPath, PATHS } from '../config/paths.js';

const execAsync = promisify(exec);

/**
 * Execute a build in isolated workspace
 * @param {Object} params - { buildId, repo, commit, ref }
 */
export async function executeBuild({ buildId, repo, commit, ref }) {
  const workspace = getWorkspacePath(buildId);
  const logFile = getLogPath(buildId);
  
  // Ensure directories exist
  await fs.mkdir(workspace, { recursive: true });
  await fs.mkdir(PATHS.LOG_BASE, { recursive: true });
  
  const log = async (message) => {
    const timestamp = new Date().toISOString();
    await fs.appendFile(logFile, `[${timestamp}] ${message}\n`);
    console.log(`[${buildId}] ${message}`);
  };
  
  try {
    await log(`Starting build for ${repo} @ ${commit}`);
    
    // Clone repository
    await log('Cloning repository...');
    const gitPath = getGitRepoPath(repo);
    await execAsync(`git clone "${gitPath}" .`, { cwd: workspace });
    
    // Checkout specific commit
    await log(`Checking out ${commit}...`);
    await execAsync(`git checkout ${commit}`, { cwd: workspace });
    
    // Read pipeline config
    const pipelineFile = path.join(workspace, 'pipeline.json');
    const pipeline = JSON.parse(await fs.readFile(pipelineFile, 'utf-8'));
    
    // Execute build steps
    for (const step of pipeline.build) {
      await log(`Executing: ${step}`);
      const { stdout, stderr } = await execAsync(step, { 
        cwd: workspace,
        timeout: (pipeline.timeout || 600) * 1000
      });
      if (stdout) await log(stdout);
      if (stderr) await log(`STDERR: ${stderr}`);
    }
    
    // Create artifact
    if (pipeline.artifact) {
      await log('Creating artifact...');
      const artifactDir = path.join(PATHS.ARTIFACT_BASE, repo);
      await fs.mkdir(artifactDir, { recursive: true });
      
      const artifactPath = getArtifactPath(repo, buildId);
      
      await execAsync(
        `tar -czf "${artifactPath}" ${pipeline.artifact}`,
        { cwd: workspace }
      );
      
      await log(`Artifact created: ${artifactPath}`);
    }
    
    await log('Build completed successfully');
    
  } catch (error) {
    await log(`ERROR: ${error.message}`);
    throw error;
  } finally {
    // Cleanup workspace (optional - keep for debugging)
    // await fs.rm(workspace, { recursive: true, force: true });
  }
}
