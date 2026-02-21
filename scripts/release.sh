#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <skilldex|vscode>"
  exit 1
}

[[ $# -ne 1 ]] && usage

case "$1" in
  skilldex)
    PKG_DIR="packages/skilldex"
    TAG_PREFIX="skilldex-v"
    ;;
  vscode)
    PKG_DIR="packages/vscode-extension"
    TAG_PREFIX="vscode-v"
    ;;
  *)
    usage
    ;;
esac

VERSION=$(node -p "require('./$PKG_DIR/package.json').version")
TAG="${TAG_PREFIX}${VERSION}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG already exists"
  exit 1
fi

echo "Creating tag: $TAG"
git tag "$TAG"
git push origin "$TAG"
echo "Pushed $TAG — GitHub Actions will handle publishing."
