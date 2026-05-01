#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/sync-push.sh [options]

Audits all worktrees in the current repository, optionally commits changes,
pushes branches and tags, writes a manifest for reconstructing worktrees
on another machine, and copies a bootstrap `sync-pull.sh` next to that
manifest for first-run setup.

Options:
  --manifest <path>         Output manifest path.
                            Default: .git/worktree-sync-manifest.json
  --prompt-commit           Prompt before committing a dirty worktree.
  --auto-commit             Auto-commit dirty worktrees.
  --commit-message <text>   Commit message prefix or exact message.
                            Default: sync checkpoint
  --include-untracked       Include untracked files when committing.
                            Default: tracked changes only (`git add -u`)
  --skip-push               Write manifest, but do not push branches/tags.
  --allow-dirty             Continue even if dirty worktrees remain.
  -h, --help                Show this help.

Examples:
  ./scripts/sync-push.sh
  ./scripts/sync-push.sh --prompt-commit
  ./scripts/sync-push.sh --auto-commit --include-untracked \
    --commit-message "sync checkpoint $(date +%F-%H%M)"
EOF
}

log() {
  printf '[sync-push] %s\n' "$*"
}

die() {
  printf '[sync-push] ERROR: %s\n' "$*" >&2
  exit 1
}

require_clean_commit_message() {
  if [[ -z "$commit_message" ]]; then
    die "Commit message must not be empty."
  fi
}

is_yes() {
  case "${1:-}" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

manifest_path=".git/worktree-sync-manifest.json"
prompt_commit=0
auto_commit=0
include_untracked=0
skip_push=0
allow_dirty=0
commit_message="sync checkpoint"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      shift
      [[ $# -gt 0 ]] || die "--manifest requires a path."
      manifest_path="$1"
      ;;
    --prompt-commit)
      prompt_commit=1
      ;;
    --auto-commit)
      auto_commit=1
      ;;
    --commit-message)
      shift
      [[ $# -gt 0 ]] || die "--commit-message requires text."
      commit_message="$1"
      ;;
    --include-untracked)
      include_untracked=1
      ;;
    --skip-push)
      skip_push=1
      ;;
    --allow-dirty)
      allow_dirty=1
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

if (( prompt_commit && auto_commit )); then
  die "Use either --prompt-commit or --auto-commit, not both."
fi

require_clean_commit_message

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || die "Run this inside a git repository."
origin_name="origin"
remote_url="$(git -C "$repo_root" remote get-url "$origin_name" 2>/dev/null || true)"

if [[ -z "$remote_url" ]]; then
  die "Remote '$origin_name' is not configured for $repo_root."
fi

manifest_abs="$manifest_path"
if [[ "$manifest_abs" != /* ]]; then
  manifest_abs="$repo_root/$manifest_abs"
fi
mkdir -p "$(dirname "$manifest_abs")"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

worktree_snapshot="$tmpdir/worktrees.txt"
worktree_manifest_rows="$tmpdir/worktree-manifest.tsv"
dirty_report="$tmpdir/dirty-report.txt"
: > "$worktree_manifest_rows"
: > "$dirty_report"

git -C "$repo_root" worktree list --porcelain > "$worktree_snapshot"

current_path=""
current_branch=""
current_head=""
current_prunable=0

commit_worktree_if_requested() {
  local worktree_path="$1"
  local branch_name="$2"
  local status_output="$3"
  local branch_slug
  local branch_message
  local prompt_message="Commit tracked changes now? [y/N] "
  local answer=""

  if [[ -z "$status_output" ]]; then
    return 0
  fi

  if (( auto_commit == 0 && prompt_commit == 0 )); then
    return 0
  fi

  if (( prompt_commit == 1 )); then
    if (( include_untracked == 1 )); then
      prompt_message="Commit tracked + untracked changes now? [y/N] "
    fi
    printf '\nDirty worktree: %s [%s]\n' "$worktree_path" "$branch_name"
    printf '%s\n' "$status_output"
    if [[ -t 0 ]]; then
      printf '%s' "$prompt_message"
      read -r answer
    elif [[ -r /dev/tty ]]; then
      printf '%s' "$prompt_message" > /dev/tty
      read -r answer < /dev/tty
    else
      log "Prompt requested, but no interactive terminal is available for $worktree_path."
      return 0
    fi
    if ! is_yes "$answer"; then
      return 0
    fi
  fi

  branch_slug="${branch_name//\//-}"
  branch_message="$commit_message"
  if [[ "$branch_message" == "sync checkpoint" ]]; then
    branch_message="$branch_message ($branch_slug)"
  fi

  if (( include_untracked == 1 )); then
    git -C "$worktree_path" add -A
  else
    git -C "$worktree_path" add -u
  fi

  if git -C "$worktree_path" diff --cached --quiet; then
    log "No staged changes to commit in $worktree_path. Dirty state remains."
    return 0
  fi

  git -C "$worktree_path" commit -m "$branch_message"
  log "Committed $worktree_path on $branch_name"
}

record_worktree() {
  local worktree_path="$1"
  local head_sha="$2"
  local branch_ref="$3"
  local prunable_flag="$4"
  local repo_relative

  if (( prunable_flag == 1 )); then
    log "Skipping prunable worktree: $worktree_path"
    return 0
  fi

  if [[ -z "$branch_ref" ]]; then
    log "Skipping detached worktree: $worktree_path"
    return 0
  fi

  repo_relative="$(python3 - <<'PY' "$repo_root" "$worktree_path"
import os
import sys
repo_root = os.path.realpath(sys.argv[1])
worktree_path = os.path.realpath(sys.argv[2])
print(os.path.relpath(worktree_path, repo_root))
PY
)"

  printf '%s\t%s\t%s\t%s\n' "$repo_relative" "$branch_ref" "$head_sha" "$worktree_path" >> "$worktree_manifest_rows"
}

finalize_current_block() {
  local status_output
  local status_after_commit
  local current_head_now
  if [[ -z "$current_path" ]]; then
    return 0
  fi

  if (( current_prunable == 1 )); then
    record_worktree "$current_path" "$current_head" "$current_branch" "$current_prunable"
    return 0
  fi

  if [[ ! -d "$current_path" ]]; then
    log "Skipping missing worktree path: $current_path"
    return 0
  fi

  status_output="$(git -C "$current_path" status --porcelain=v1 --untracked-files=all || true)"
  commit_worktree_if_requested "$current_path" "$current_branch" "$status_output"
  status_after_commit="$(git -C "$current_path" status --porcelain=v1 --untracked-files=all || true)"
  if [[ -n "$status_after_commit" ]]; then
    printf '%s\t%s\n' "$current_path" "$current_branch" >> "$dirty_report"
  fi
  current_head_now="$(git -C "$current_path" rev-parse HEAD 2>/dev/null || printf '%s' "$current_head")"
  record_worktree "$current_path" "$current_head_now" "$current_branch" "$current_prunable"
}

while IFS= read -r line <&3 || [[ -n "$line" ]]; do
  if [[ -z "$line" ]]; then
    finalize_current_block
    current_path=""
    current_branch=""
    current_head=""
    current_prunable=0
    continue
  fi

  case "$line" in
    worktree\ *)
      current_path="${line#worktree }"
      ;;
    HEAD\ *)
      current_head="${line#HEAD }"
      ;;
    branch\ refs/heads/*)
      current_branch="${line#branch refs/heads/}"
      ;;
    prunable*)
      current_prunable=1
      ;;
  esac
done 3< "$worktree_snapshot"

finalize_current_block

if [[ -s "$dirty_report" && $allow_dirty -eq 0 ]]; then
  cat >&2 <<EOF
[sync-push] Dirty worktrees remain. Commit or stash them before syncing, or rerun with:
  --prompt-commit
  --auto-commit
  --allow-dirty

Dirty worktrees:
EOF
  while IFS=$'\t' read -r worktree_path branch_name; do
    printf '  %s [%s]\n' "$worktree_path" "$branch_name" >&2
  done < "$dirty_report"
  exit 1
fi

python3 - <<'PY' "$manifest_abs" "$repo_root" "$remote_url" "$worktree_manifest_rows"
import json
import os
import sys

manifest_path, repo_root, remote_url, rows_path = sys.argv[1:5]
entries = []
with open(rows_path, 'r', encoding='utf-8') as handle:
    for raw in handle:
        raw = raw.rstrip('\n')
        if not raw:
            continue
        rel_path, branch, head, abs_path = raw.split('\t', 3)
        if rel_path == '.':
            continue
        entries.append(
            {
                "path": rel_path,
                "branch": branch,
                "head": head,
                "source_path": abs_path,
            }
        )

payload = {
    "schema_version": 1,
    "generated_from_repo": os.path.realpath(repo_root),
    "origin": remote_url,
    "worktrees": entries,
}

with open(manifest_path, 'w', encoding='utf-8') as handle:
    json.dump(payload, handle, indent=2)
    handle.write('\n')
PY

bootstrap_pull_path="$(dirname "$manifest_abs")/sync-pull.sh"
cp "$repo_root/scripts/sync-pull.sh" "$bootstrap_pull_path"
chmod +x "$bootstrap_pull_path"

if (( skip_push == 0 )); then
  log "Pushing branches to $origin_name"
  git -C "$repo_root" push --all "$origin_name"
  log "Pushing tags to $origin_name"
  git -C "$repo_root" push --tags "$origin_name"
else
  log "Skipping push as requested"
fi

log "Manifest written to $manifest_abs"
log "Bootstrap pull script copied to $bootstrap_pull_path"
printf '\nRecreate these worktrees on another machine:\n'
python3 - <<'PY' "$manifest_abs"
import json
import sys

with open(sys.argv[1], 'r', encoding='utf-8') as handle:
    payload = json.load(handle)

for entry in payload.get("worktrees", []):
    print(f"  {entry['path']} <- {entry['branch']}")
PY
