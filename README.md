# Mini Jenkins - Local CI/CD Orchestrator

A lightweight, local CI/CD engine built with Node.js and React, designed to run on your LAN without requiring GitHub or internet connectivity.

**✅ Cross-platform**: Runs on Linux, macOS, and Windows.

## Quick Start

### Prerequisites

- Node.js >= 18
- Git

### Installation

```bash
# Install backend dependencies
cd orchestrator
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running

**Linux/macOS:**

```bash
# Create a repository
./setup-repo.sh my-app

# Start backend (from orchestrator/)
npm run dev

# Start frontend (from frontend/)
npm run dev
```

**Windows:**

```cmd
REM Create a repository
setup-repo.bat my-app

REM Start backend (from orchestrator/)
npm run dev

REM Start frontend (from frontend/)
npm run dev
```

## Architecture

See [architecture.md](./architecture.md) for detailed system design.

### Key Components

- **Local Git Server**: Bare repositories with post-receive hooks
- **Build Orchestrator**: Node.js API with SQLite job queue
- **Build Worker**: Isolated workspace execution with polling
- **Artifact Storage**: Immutable build outputs
- **Atomic Deployment**: Symlink-based releases (junctions on Windows)

### Cross-Platform Design

- **Dynamic paths**: Uses `os.tmpdir()` for temp directories
- **Node.js hooks**: post-receive implemented in JavaScript (not bash)
- **Windows symlinks**: Falls back to junctions or file-based references
- **Path handling**: All paths use `path.join()` for correct separators
- **SQLite queue**: File-based job queue (no external services required)

## Project Structure

```
mini-jenkins/
├── orchestrator/          # Node.js backend
│   └── src/
│       ├── api/           # HTTP controllers
│       ├── core/          # SQLite queue, worker, executor
│       ├── services/      # Git, build, deploy logic
│       ├── models/        # Data models
│       └── config/        # Path configuration
├── frontend/              # React.js UI
├── git/                   # Local git repositories
│   ├── projects/          # Bare repos
│   └── hooks/             # Hook templates (post-receive.js)
└── pipeline.json          # Build configuration example
```

### Runtime Directories

All runtime data is stored in your system's temp directory:

- **Linux/macOS**: `/tmp/mini-jenkins/`
- **Windows**: `C:\Users\<user>\AppData\Local\Temp\mini-jenkins\`

Contains:

- `workspaces/` - Build workspaces
- `artifacts/` - Build artifacts (.tar.gz)
- `logs/` - Build logs
- `deploy/` - Deployment releases
- `queue.db` - SQLite job queue database

## Build Identity

Every build is immutable with ID format: `<timestamp>-<commit-hash>`

## Workflow

1. Developer pushes to local git repo
2. post-receive hook triggers webhook
3. Orchestrator enqueues build job
4. Worker clones, builds, creates artifact
5. Artifact stored in `/ci/artifacts/`
6. Deploy extracts to `/deploy/releases/`
7. Atomic switch via symlink update

## Deployment Structure

```
/deploy/my-app/
├── releases/
│   ├── 20260131-a91f3e2/
│   └── 20260130-b12caa1/
└── current -> releases/20260131-a91f3e2
```

Rollback = change symlink target

## License

ISC
