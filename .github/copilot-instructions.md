# Copilot Instructions for mini-jenkins

## Architecture Overview

**mini-jenkins** is a local CI/CD orchestrator that eliminates GitHub dependency. It's a learning-focused Jenkins alternative built with Node.js + React.

### Core Principle: Immutability & Atomicity

- **Build ID format**: `<timestamp>-<commit-hash>` (e.g., `1738339200-a91f3e2`)
- Every build is **immutable** and **reproducible**
- Deployments are **atomic** via symlink swaps
- Git is the source, NOT the runtime (artifacts are independent)

### System Flow

```
Developer push → Local Git → post-receive hook → Webhook (port 4000)
  → BullMQ queue → Worker (isolated workspace) → Build → Artifact (.tar.gz)
  → Deploy (extract to /releases/) → Atomic symlink switch
```

### Directory Structure

```
orchestrator/src/
├── api/              # HTTP controllers (webhook, build)
├── core/             # queue.js, worker.js, executor.js
├── services/         # git.service, build.service, deploy.service
└── models/           # build.model.js

frontend/src/
├── pages/            # Dashboard, BuildDetail
└── App.jsx           # React Router setup

git/
├── projects/         # Bare repositories (*.git)
└── hooks/            # post-receive template
```

### Runtime Paths (Cross-Platform!)

Paths are dynamically generated using Node.js `os.tmpdir()` via `orchestrator/src/config/paths.js`:

- **Workspaces**: `<tmpdir>/mini-jenkins/workspaces/build-<buildId>/`
- **Artifacts**: `<tmpdir>/mini-jenkins/artifacts/<repo>/app-<buildId>.tar.gz`
- **Logs**: `<tmpdir>/mini-jenkins/logs/build-<buildId>.log`
- **Deployments**: `<tmpdir>/mini-jenkins/deploy/<repo>/releases/<buildId>/`
- **Current release**: `<tmpdir>/mini-jenkins/deploy/<repo>/current` → symlink/junction

Where `<tmpdir>` is:

- Linux/macOS: `/tmp/`
- Windows: `C:\Users\<user>\AppData\Local\Temp\`

## Development Workflow

### First-Time Setup

**Linux/macOS:**

```bash
# 1. Install dependencies
cd orchestrator && npm install
cd ../frontend && npm install

# 2. Create a repository
./setup-repo.sh my-app

# 3. Start backend (port 4000)
cd orchestrator && npm run dev

# 4. Start frontend (port 3000)
cd frontend && npm run dev
```

**Windows:**

```cmd
REM 1. Install dependencies
cd orchestrator && npm install
cd ..\.\frontend && npm install

REM 2. Create a repository
setup-repo.bat my-app

REM 3. Start backend (port 4000)
cd orchestrator && npm run dev

REM 4. Start frontend (port 3000) in new terminal
cd frontend && npm run dev
```

### Creating a New Repository

**Linux/macOS:**

```bash
./setup-repo.sh <repo-name>
```

**Windows:**

```cmd
setup-repo.bat <repo-name>
```

This creates `git/projects/<repo>.git` with Node.js-based post-receive hook

### Testing the Pipeline

```bash
# Clone your local repo
git clone /path/to/mini-jenkins/git/projects/my-app.git
cd my-app

# Add pipeline.json to your project
cat > pipeline.json << 'EOF'
{
  "build": ["npm ci", "npm run build"],
  "artifact": "dist",
  "deploy": true,
  "timeout": 600
}
EOF

# Push triggers build
git add pipeline.json
git commit -m "Add pipeline"
git push origin main
```

## Key Implementation Details

### Build Isolation (executor.js)

- Each build runs in isolated workspace: `<tmpdir>/mini-jenkins/workspaces/build-<buildId>/`
- Workspace is created fresh per build (no state leakage)
- Logs capture stdout/stderr with timestamps
- Cleanup optional (keep for debugging)
- Paths are cross-platform via `orchestrator/src/config/paths.js`

### Queue System (queue.js + worker.js)

- Uses **SQLite** for persistent job storage
- **Poll-based worker**: Checks for new jobs every 2 seconds
- Phase 1: **Sequential builds** (one at a time)
- Phase 2 (future): Parallel workers
- States: `pending` → `running` → `success`/`failed`
- Database: `<tmpdir>/mini-jenkins/queue.db`
- Transaction-safe job claiming (prevents race conditions)

### Atomic Deployment (deploy.service.js)

```javascript
// Critical pattern: atomic symlink/junction swap (cross-platform)
const tmpLink = `${currentLink}.tmp`;
try {
  await fs.symlink(
    releaseDir,
    tmpLink,
    os.platform() === 'win32' ? 'junction' : 'dir',
  );
} catch (err) {
  // Fallback for Windows without permissions
  await fs.writeFile(tmpLink, releaseDir, 'utf-8');
}
await fs.rename(tmpLink, currentLink); // Atomic!
```

Rollback = just point symlink to previous release

### Git Hook Integration

- **Implementation**: Node.js-based `post-receive.js` (cross-platform)
- **Wrappers**: `post-receive` (Unix shell), `post-receive.bat` (Windows)
- **Location**: `git/projects/<repo>.git/hooks/`
- **Trigger**: Reads `oldrev newrev ref` from stdin
- **Action**: Sends webhook to `http://localhost:4000/webhook` using fetch API
- **Environment**: `ORCHESTRATOR_URL` can override endpoint

## Project-Specific Patterns

### Configuration: pipeline.json

Every project MUST have `pipeline.json` in root:

```json
{
  "build": ["npm ci", "npm test", "npm run build"],
  "artifact": "dist",
  "deploy": true,
  "timeout": 600
}
```

- `build`: Array of shell commands (executed sequentially)
- `artifact`: Directory to package (tar.gz)
- `deploy`: Auto-deploy on success
- `timeout`: Seconds per build step

### Build ID Generation

```javascript
const buildId = `${Date.now()}-${commit.substring(0, 7)}`;
```

Used consistently across: workspace paths, artifact names, deploy releases

### Error Handling

- Build failures are logged to `/tmp/logs/build-<buildId>.log`
- Worker retries are manual via UI (Phase 1)
- Timeouts per step (default 600s)

### API Endpoints

```
POST /webhook                    # Triggered by git hook
GET  /api/builds                 # List all builds
GET  /api/builds/:id             # Build details
POST /api/builds/:id/retry       # Retry failed build
POST /api/deploy/:id/rollback    # Rollback deployment (TODO)
```

## Critical Files

- **orchestrator/src/app.js**: Express server entry point, route registration
- **orchestrator/src/core/executor.js**: Build execution logic (clone → checkout → build → artifact)
- **orchestrator/src/core/queue.js**: SQLite-based job queue (enqueue, getNextJob, completeJob)
- **orchestrator/src/core/worker.js**: Poll-based worker that processes jobs
- **git/hooks/post-receive.js**: Node.js-based webhook trigger (cross-platform)
- **pipeline.json**: Per-project build configuration
- **architecture.md**: Full system specification

## Common Tasks

### Add new API endpoint

1. Create controller in `orchestrator/src/api/`
2. Register route in `orchestrator/src/app.js`
3. Update frontend to consume (if needed)

### Add new service

1. Create in `orchestrator/src/services/`
2. Export async functions
3. Import in controllers or executor

### Extend Build Model

1. Edit `orchestrator/src/models/build.model.js`
2. Update SQLite schema in `orchestrator/src/core/queue.js` (jobs table)
3. Add new columns and indexes as needed

### Add Frontend Page

1. Create in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Use `fetch('/api/...')` - Vite proxy handles CORS

## Philosophy

> "This isn't a Jenkins killer. It's **Jenkins you understand from the inside**."

Every component is intentionally simple to teach CI/CD fundamentals without enterprise complexity.
