#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/sync-pull.sh --manifest <path> [options]

Clones or updates a repository, fetches branches, and recreates worktrees from
the manifest produced by ./scripts/sync-push.sh.

Options:
  --manifest <path>       Path to a worktree-sync manifest JSON file.
  --repo-dir <path>       Local clone directory.
                          Default: basename of the manifest origin URL
  --repo-url <url>        Override the origin URL from the manifest.
  --origin <name>         Remote name to fetch from. Default: origin
  --skip-clone            Require an existing repo-dir; do not clone.
  --prune                 Run `git worktree prune` before reconciliation.
  -h, --help              Show this help.

Examples:
  ./scripts/sync-pull.sh --manifest ./worktree-sync-manifest.json
  ./scripts/sync-pull.sh --manifest ./worktree-sync-manifest.json \
    --repo-dir ~/projects/metacurtis-v3.1
EOF
}

log() {
  printf '[sync-pull] %s\n' "$*"
}

die() {
  printf '[sync-pull] ERROR: %s\n' "$*" >&2
  exit 1
}

manifest_path=""
repo_dir=""
repo_url=""
origin_name="origin"
skip_clone=0
prune_first=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      shift
      [[ $# -gt 0 ]] || die "--manifest requires a path."
      manifest_path="$1"
      ;;
    --repo-dir)
      shift
      [[ $# -gt 0 ]] || die "--repo-dir requires a path."
      repo_dir="$1"
      ;;
    --repo-url)
      shift
      [[ $# -gt 0 ]] || die "--repo-url requires a URL."
      repo_url="$1"
      ;;
    --origin)
      shift
      [[ $# -gt 0 ]] || die "--origin requires a name."
      origin_name="$1"
      ;;
    --skip-clone)
      skip_clone=1
      ;;
    --prune)
      prune_first=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
  shift
done

[[ -n "$manifest_path" ]] || die "--manifest is required."
[[ -f "$manifest_path" ]] || die "Manifest not found: $manifest_path"

manifest_abs="$manifest_path"
if [[ "$manifest_abs" != /* ]]; then
  manifest_abs="$(cd "$(dirname "$manifest_path")" && pwd)/$(basename "$manifest_path")"
fi

read_manifest_field() {
  python3 - <<'PY' "$manifest_abs" "$1"
import json
import sys

manifest_path = sys.argv[1]
field = sys.argv[2]
with open(manifest_path, 'r', encoding='utf-8') as handle:
    payload = json.load(handle)
value = payload.get(field, "")
print(value if value is not None else "")
PY
}

manifest_origin="$(read_manifest_field origin)"

if [[ -z "$repo_url" ]]; then
  repo_url="$manifest_origin"
fi

if [[ -z "$repo_url" ]]; then
  die "No repo URL provided and manifest origin is empty."
fi

if [[ -z "$repo_dir" ]]; then
  repo_dir="$(python3 - <<'PY' "$repo_url"
import os
import re
import sys

url = sys.argv[1].rstrip('/')
name = url.rsplit('/', 1)[-1]
name = re.sub(r'\.git$', '', name)
print(os.path.abspath(name))
PY
)"
fi

repo_dir="$(python3 - <<'PY' "$repo_dir"
import os
import sys
print(os.path.abspath(os.path.expanduser(sys.argv[1])))
PY
)"

if git -C "$repo_dir" rev-parse --show-toplevel >/dev/null 2>&1; then
  log "Using existing repo at $repo_dir"
elif (( skip_clone == 1 )); then
  die "Repo directory does not exist or is not a git repository: $repo_dir"
else
  mkdir -p "$(dirname "$repo_dir")"
  log "Cloning $repo_url into $repo_dir"
  git clone "$repo_url" "$repo_dir"
fi

git -C "$repo_dir" rev-parse --show-toplevel >/dev/null 2>&1 || die "$repo_dir is not a git repository."

log "Fetching branches and tags from $origin_name"
git -C "$repo_dir" fetch "$origin_name" --prune --tags

if (( prune_first == 1 )); then
  log "Pruning stale worktree metadata"
  git -C "$repo_dir" worktree prune
fi

python3 - <<'PY' "$manifest_abs" "$repo_dir" "$origin_name"
import json
import os
import subprocess
import sys

manifest_path, repo_dir, origin_name = sys.argv[1:4]

def run(*args):
    subprocess.run(args, check=True)

def capture(*args):
    return subprocess.check_output(args, text=True).strip()

def local_branch_exists(branch):
    return subprocess.run(
        ["git", "-C", repo_dir, "show-ref", "--verify", "--quiet", f"refs/heads/{branch}"]
    ).returncode == 0

def remote_branch_exists(branch):
    return subprocess.run(
        ["git", "-C", repo_dir, "show-ref", "--verify", "--quiet", f"refs/remotes/{origin_name}/{branch}"]
    ).returncode == 0

def current_worktrees():
    output = capture("git", "-C", repo_dir, "worktree", "list", "--porcelain")
    rows = []
    current = {}
    for line in output.splitlines():
        if not line:
            if current:
                rows.append(current)
            current = {}
            continue
        key, _, value = line.partition(" ")
        current[key] = value
    if current:
        rows.append(current)
    mapping = {}
    for row in rows:
        path = os.path.realpath(row["worktree"])
        branch_ref = row.get("branch", "")
        branch = branch_ref.replace("refs/heads/", "") if branch_ref.startswith("refs/heads/") else ""
        mapping[path] = branch
    return mapping

with open(manifest_path, 'r', encoding='utf-8') as handle:
    payload = json.load(handle)

worktrees = payload.get("worktrees", [])
existing = current_worktrees()

for entry in worktrees:
    rel_path = entry["path"]
    branch = entry["branch"]
    target_path = os.path.realpath(os.path.join(repo_dir, rel_path))

    existing_branch = existing.get(target_path)
    if existing_branch == branch:
      print(f"[sync-pull] Worktree already present: {target_path} [{branch}]")
      continue
    if existing_branch and existing_branch != branch:
      raise SystemExit(
          f"[sync-pull] ERROR: {target_path} already exists for branch {existing_branch}, expected {branch}"
      )

    if os.path.exists(target_path):
      raise SystemExit(
          f"[sync-pull] ERROR: target path already exists but is not the expected worktree: {target_path}"
      )

    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    if local_branch_exists(branch):
      run("git", "-C", repo_dir, "worktree", "add", target_path, branch)
    elif remote_branch_exists(branch):
      run("git", "-C", repo_dir, "worktree", "add", "-b", branch, target_path, f"{origin_name}/{branch}")
    else:
      raise SystemExit(f"[sync-pull] ERROR: branch not found locally or on {origin_name}: {branch}")

    print(f"[sync-pull] Created worktree: {target_path} [{branch}]")
PY

log "Worktree sync complete"
