import fs from 'fs';
import path from 'path';
export async function* walk(dir, exts = new Set(['.js','.jsx','.ts','.tsx','.glsl','.cjs','.mjs','.json'])) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|\.git|dist|build|out|coverage|playwright-report/.test(p)) continue;
      yield* walk(p, exts);
    } else {
      const ext = path.extname(p).toLowerCase();
      if (exts.has(ext)) yield p;
    }
  }
}
