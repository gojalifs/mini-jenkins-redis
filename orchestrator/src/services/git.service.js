import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Clone a git repository
 */
export async function cloneRepo(repoPath, targetDir) {
  await execAsync(`git clone ${repoPath} ${targetDir}`);
}

/**
 * Checkout specific commit
 */
export async function checkoutCommit(workdir, commit) {
  await execAsync(`git checkout ${commit}`, { cwd: workdir });
}

/**
 * Get commit information
 */
export async function getCommitInfo(workdir, commit) {
  const { stdout } = await execAsync(
    `git log -1 --format="%H|%an|%ae|%s" ${commit}`,
    { cwd: workdir }
  );
  
  const [hash, author, email, message] = stdout.trim().split('|');
  return { hash, author, email, message };
}
