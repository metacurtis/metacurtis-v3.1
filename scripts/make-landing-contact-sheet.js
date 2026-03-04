/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const SCREEN_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-screens');

function latestRunDir() {
  if (!fs.existsSync(SCREEN_DIR)) return null;

  const dirs = fs
    .readdirSync(SCREEN_DIR)
    .filter((name) => name.startsWith('run-'))
    .map((name) => path.join(SCREEN_DIR, name))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

  return dirs.at(-1) || null;
}

function rel(from, to) {
  return path.relative(from, to).replaceAll(path.sep, '/');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function main() {
  const runDir = latestRunDir();
  if (!runDir) {
    console.error('[contact-sheet] No screenshot run directories found.');
    process.exit(1);
  }

  const manifestPath = path.join(runDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`[contact-sheet] Missing manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const cards = (manifest.checkpoints || [])
    .map((cp) => {
      const u = cp?.state?.uniforms || {};
      const img = rel(runDir, cp.file);
      return `
        <section class="card">
          <h2>${escapeHtml(cp.offsetMs)}ms</h2>
          <img src="${escapeHtml(img)}" alt="landing ${escapeHtml(cp.offsetMs)}ms" />
          <pre>${escapeHtml(
            JSON.stringify(
              {
                camera: cp.state?.camera ?? null,
                drawCount: cp.state?.drawCount ?? null,
                uniforms: {
                  uMorphProgress: u.uMorphProgress ?? null,
                  uPointSize: u.uPointSize ?? null,
                  uGaussianSigma: u.uGaussianSigma ?? null,
                  uDepthFalloffPower: u.uDepthFalloffPower ?? null,
                  uFlowTurbulence: u.uFlowTurbulence ?? null,
                  uStreakIntensity: u.uStreakIntensity ?? null,
                  uSpreadFactor: u.uSpreadFactor ?? null,
                  uOpacityMin: u.uOpacityMin ?? null,
                  uOpacityMax: u.uOpacityMax ?? null,
                },
              },
              null,
              2
            )
          )}</pre>
        </section>
      `;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Landing Velocity Contact Sheet</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0b0d10;
      color: #f5f7fa;
      margin: 24px;
    }
    h1 {
      margin-bottom: 8px;
    }
    .meta {
      opacity: 0.8;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
      gap: 20px;
    }
    .card {
      background: #141922;
      border: 1px solid #2a3140;
      border-radius: 12px;
      padding: 16px;
    }
    img {
      width: 100%;
      border-radius: 8px;
      display: block;
      margin-bottom: 12px;
      border: 1px solid #2a3140;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      line-height: 1.4;
      background: #0f131a;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #232b38;
    }
  </style>
</head>
<body>
  <h1>Landing Velocity Contact Sheet</h1>
  <div class="meta">
    <div><strong>Run:</strong> ${escapeHtml(runDir)}</div>
    <div><strong>URL:</strong> ${escapeHtml(manifest.url || '')}</div>
    <div><strong>Generated:</strong> ${escapeHtml(new Date().toISOString())}</div>
  </div>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

  const outPath = path.join(runDir, 'contact-sheet.html');
  fs.writeFileSync(outPath, html);
  console.log(`[contact-sheet] Saved: ${outPath}`);
}

main();
