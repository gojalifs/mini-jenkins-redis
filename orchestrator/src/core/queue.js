import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR = path.join(os.tmpdir(), 'mini-jenkins');
const DB_PATH = path.join(DB_DIR, 'queue.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Create jobs table
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    build_id TEXT UNIQUE NOT NULL,
    repo TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    ref TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    completed_at INTEGER
  );
  
  CREATE INDEX IF NOT EXISTS idx_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_created ON jobs(created_at);
`);

/**
 * Enqueue a new build job
 * @param {Object} job - { repo, commit, ref }
 * @returns {Promise<string>} buildId
 */
export async function enqueueBuild(job) {
  const buildId = `${Date.now()}-${job.commit.substring(0, 7)}`;
  
  const insert = db.prepare(`
    INSERT INTO jobs (build_id, repo, commit_hash, ref, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insert.run(buildId, job.repo, job.commit, job.ref, Date.now());
  
  return buildId;
}/**
 * Get next pending job and mark as running
 * @returns {Object|null} job data or null if no pending jobs
 */
export function getNextJob() {
  return db.transaction(() => {
    // Find oldest pending job
    const job = db
      .prepare(
        `
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 1
    `,
      )
      .get();

    if (!job) return null;

    // Mark as running
    db.prepare(
      `
      UPDATE jobs 
      SET status = 'running', started_at = ? 
      WHERE id = ?
    `,
    ).run(Date.now(), job.id);

    return {
      id: job.id,
      buildId: job.build_id,
      repo: job.repo,
      commit: job.commit_hash,
      ref: job.ref
    };
  })();
}

/**
 * Mark job as completed
 */
export function completeJob(buildId, success = true, error = null) {
  const update = db.prepare(`
    UPDATE jobs 
    SET status = ?, completed_at = ?, error = ?
    WHERE build_id = ?
  `);

  update.run(success ? 'success' : 'failed', Date.now(), error, buildId);
}

/**
 * Get queue statistics
 */
export function getQueueStatus() {
  const stats = db
    .prepare(
      `
    SELECT 
      status,
      COUNT(*) as count
    FROM jobs
    GROUP BY status
  `,
    )
    .all();

  const result = {
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
  };

  stats.forEach((s) => {
    result[s.status] = s.count;
  });

  return result;
}

/**
 * Get all jobs (for API)
 */
export function getAllJobs(limit = 50) {
  return db
    .prepare(
      `
    SELECT 
      build_id as id,
      repo,
      commit_hash as commit,
      ref,
      status,
      created_at as createdAt,
      started_at as startedAt,
      completed_at as completedAt,
      error
    FROM jobs
    ORDER BY created_at DESC
    LIMIT ?
  `,
    )
    .all(limit);
}

/**
 * Get job by build ID
 */
export function getJobById(buildId) {
  return db
    .prepare(
      `
    SELECT 
      build_id as id,
      repo,
      commit_hash as commit,
      ref,
      status,
      created_at as createdAt,
      started_at as startedAt,
      completed_at as completedAt,
      error
    FROM jobs
    WHERE build_id = ?
  `,
    )
    .get(buildId);
}

/**
 * Retry a failed job
 */
export function retryJob(buildId) {
  const update = db.prepare(`
    UPDATE jobs
    SET status = 'pending', started_at = NULL, completed_at = NULL, error = NULL
    WHERE build_id = ? AND status = 'failed'
  `);

  const result = update.run(buildId);
  return result.changes > 0;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  db.close();
}

export default {
  enqueueBuild,
  getNextJob,
  completeJob,
  getQueueStatus,
  getAllJobs,
  getJobById,
  retryJob,
  closeDatabase,
};
