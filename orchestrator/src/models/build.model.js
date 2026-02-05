/**
 * Build model
 * State: pending | running | success | failed
 */

export class Build {
  constructor(data) {
    this.id = data.id;
    this.repo = data.repo;
    this.commit = data.commit;
    this.ref = data.ref;
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.artifact = data.artifact;
    this.error = data.error;
  }
  
  static fromJSON(json) {
    return new Build(json);
  }
  
  toJSON() {
    return {
      id: this.id,
      repo: this.repo,
      commit: this.commit,
      ref: this.ref,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      artifact: this.artifact,
      error: this.error
    };
  }
}
