#!/usr/bin/env bash
# Publish public/ to the gh-pages branch, which GitHub Pages serves.
# Used by .github/workflows/publish.yml after npm run verify passes on main.
# Set DRY_RUN=1 to build the publish commit locally without pushing.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
source_sha=$(git -C "$root" rev-parse --short HEAD)
work=$(mktemp -d)
trap 'git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

git -C "$root" fetch --depth=1 origin gh-pages
git -C "$root" worktree add --detach "$work" FETCH_HEAD >/dev/null

# Replace everything except git metadata with public/; .nojekyll serves files as-is.
find "$work" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$root/public/." "$work/"
touch "$work/.nojekyll"

git -C "$work" add -A
if git -C "$work" diff --cached --quiet; then
  echo "gh-pages already matches public/ at $source_sha; nothing to publish."
  exit 0
fi
git -C "$work" diff --cached --stat
git -C "$work" \
  -c user.name="github-actions[bot]" \
  -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "Publish main at $source_sha"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "DRY_RUN: built $(git -C "$work" rev-parse --short HEAD) on gh-pages; not pushed."
  git -C "$work" ls-tree -r --name-only HEAD
  exit 0
fi
git -C "$work" push origin HEAD:refs/heads/gh-pages
echo "Published main at $source_sha to gh-pages."
