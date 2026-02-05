# Git Repository Setup

This directory contains:
- `projects/` - Bare git repositories
- `hooks/` - Hook templates

## Creating a New Repository

Use the provided script:

```bash
./setup-repo.sh my-app
```

This will:
1. Create a bare repository at `git/projects/my-app.git`
2. Install the post-receive hook
3. Make the hook executable

## Manual Setup

```bash
# Create bare repo
git init --bare git/projects/my-app.git

# Install hook
cp git/hooks/post-receive git/projects/my-app.git/hooks/
chmod +x git/projects/my-app.git/hooks/post-receive
```

## Cloning

```bash
# Local clone
git clone /path/to/mini-jenkins/git/projects/my-app.git

# Or via SSH (if SSH server is configured)
git clone user@server:/path/to/git/projects/my-app.git
```

## How It Works

When you push to the repository:
1. Git executes `hooks/post-receive`
2. Hook sends webhook to orchestrator at `http://localhost:4000/webhook`
3. Orchestrator enqueues the build job
4. Worker picks up and executes the build

## Environment Variables

- `ORCHESTRATOR_URL` - Override orchestrator endpoint (default: http://localhost:4000)
