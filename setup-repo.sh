#!/bin/bash
# setup-repo.sh - Initialize a new bare repository with post-receive hook

if [ -z "$1" ]; then
  echo "Usage: ./setup-repo.sh <repo-name>"
  exit 1
fi

REPO_NAME=$1
REPO_PATH="./git/projects/${REPO_NAME}.git"
HOOK_TEMPLATE_JS="./git/hooks/post-receive.js"
HOOK_TEMPLATE_SH="./git/hooks/post-receive"

# Create bare repository
echo "Creating bare repository: $REPO_PATH"
git init --bare "$REPO_PATH"

# Install post-receive hooks
echo "Installing post-receive hooks..."
cp "$HOOK_TEMPLATE_JS" "$REPO_PATH/hooks/post-receive.js"
cp "$HOOK_TEMPLATE_SH" "$REPO_PATH/hooks/post-receive"
chmod +x "$REPO_PATH/hooks/post-receive"
chmod +x "$REPO_PATH/hooks/post-receive.js"

echo ""
echo "✅ Repository created successfully!"
echo ""
echo "Clone with:"
echo "  git clone $PWD/$REPO_PATH"
echo ""
echo "Or via SSH (if configured):"
echo "  git clone user@hostname:$REPO_PATH"
