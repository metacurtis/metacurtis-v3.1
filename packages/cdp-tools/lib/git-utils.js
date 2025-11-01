import { execSync } from 'child_process';

export function currentBranch(cwd = process.cwd()) {
  try {
    return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function isCleanTree(cwd = process.cwd()) {
  try {
    const output = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
    return output.trim().length === 0;
  } catch {
    return false;
  }
}

export function stagedFiles(cwd = process.cwd()) {
  try {
    const output = execSync('git diff --name-only --cached', { cwd, encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export function ensureGitAvailable(cwd = process.cwd()) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
  } catch {
    throw new Error('Git repository not found. Initialize git before using CDP.');
  }
}
