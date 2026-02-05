#!/usr/bin/env node
/**
 * post-receive hook for mini-jenkins (Node.js version - cross-platform)
 * Place this in git/projects/<repo>.git/hooks/post-receive
 * 
 * On Unix: chmod +x post-receive
 * On Windows: Ensure Node.js is in PATH
 */

import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:4000';

// Read from stdin (git provides: oldrev newrev ref)
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const [oldrev, newrev, ref] = line.trim().split(/\s+/);
  
  if (!newrev || !ref) {
    console.error('Invalid input from git');
    return;
  }
  
  // Extract repo name from current directory
  const cwd = process.cwd();
  const repoName = basename(cwd).replace('.git', '');
  
  console.log(`Triggering build for ${repoName} @ ${newrev} (${ref})`);
  
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo: repoName,
        commit: newrev,
        ref: ref
      })
    });
    
    if (response.ok) {
      console.log('Build triggered successfully');
    } else {
      console.error(`Failed to trigger build: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error triggering build: ${error.message}`);
  }
});
