import { readdir } from 'fs/promises';
import { join } from 'path';

export async function* walk(dir, exts = ['.js', '.jsx', '.mjs']) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.vite'].includes(entry.name)) continue;
      yield* walk(fullPath, exts);
    } else if (entry.isFile() && (exts.length === 0 || exts.some(e => entry.name.endsWith(e)))) {
      yield fullPath;
    }
  }
}
