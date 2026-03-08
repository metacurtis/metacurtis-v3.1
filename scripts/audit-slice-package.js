/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'configs', 'slice-package-manifest.json');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const OUTPUT_ROOT = path.join(ROOT, 'reports', 'slice-package-audit');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const runStamp = nowStamp();
  const runDir = path.join(OUTPUT_ROOT, `run-${runStamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  const checks = [];
  const add = (name, pass, details = null) => checks.push({ name, pass: !!pass, details });

  add('manifest exists', fs.existsSync(MANIFEST_PATH), { path: MANIFEST_PATH });
  add('package.json exists', fs.existsSync(PACKAGE_JSON_PATH), { path: PACKAGE_JSON_PATH });

  const manifest = fs.existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : null;
  const packageJson = fs.existsSync(PACKAGE_JSON_PATH) ? readJson(PACKAGE_JSON_PATH) : null;

  add('manifest version = 1.0', manifest?.version === '1.0', { actual: manifest?.version ?? null });
  add('baseline scenario present', typeof manifest?.baseline?.scenarioId === 'string', {
    actual: manifest?.baseline?.scenarioId ?? null,
  });
  add('baseline gate script present', typeof manifest?.baseline?.gateScript === 'string', {
    actual: manifest?.baseline?.gateScript ?? null,
  });
  add('required audits list present', Array.isArray(manifest?.baseline?.requiredAudits), {
    actual: manifest?.baseline?.requiredAudits ?? null,
  });
  add('packages present', Array.isArray(manifest?.packages) && manifest.packages.length >= 1, {
    count: manifest?.packages?.length ?? 0,
  });
  add('delivery requiredArtifacts present', Array.isArray(manifest?.delivery?.requiredArtifacts), {
    count: manifest?.delivery?.requiredArtifacts?.length ?? 0,
  });
  add('delivery requiredDocs present', Array.isArray(manifest?.delivery?.requiredDocs), {
    count: manifest?.delivery?.requiredDocs?.length ?? 0,
  });

  if (manifest?.baseline?.gateScript && packageJson?.scripts) {
    add('gate script exists in package.json', Object.prototype.hasOwnProperty.call(packageJson.scripts, manifest.baseline.gateScript), {
      script: manifest.baseline.gateScript,
    });
  }

  for (const auditScript of manifest?.baseline?.requiredAudits || []) {
    add(`required audit script exists: ${auditScript}`, Object.prototype.hasOwnProperty.call(packageJson?.scripts || {}, auditScript), {
      script: auditScript,
    });
  }

  for (const docPath of manifest?.delivery?.requiredDocs || []) {
    const absPath = path.join(ROOT, docPath);
    add(`required doc exists: ${docPath}`, fs.existsSync(absPath), { path: absPath });
  }

  for (const pkg of manifest?.packages || []) {
    add(`package id present: ${pkg?.id || 'unknown'}`, typeof pkg?.id === 'string' && pkg.id.length > 0, pkg);
    add(`package label present: ${pkg?.id || 'unknown'}`, typeof pkg?.label === 'string' && pkg.label.length > 0, pkg);
    add(`package deliverables present: ${pkg?.id || 'unknown'}`, Array.isArray(pkg?.deliverables) && pkg.deliverables.length > 0, pkg);
  }

  const failedChecks = checks.filter((entry) => !entry.pass);
  const pass = failedChecks.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    manifestPath: MANIFEST_PATH,
    packageJsonPath: PACKAGE_JSON_PATH,
    pass,
    checks,
    failedChecks,
  };

  const reportPath = path.join(runDir, `slice-package-audit-${runStamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!pass) {
    console.error('[slice-package-audit] FAIL');
    console.error(`[slice-package-audit] Saved: ${reportPath}`);
    process.exit(1);
  }

  console.log('[slice-package-audit] PASS');
  console.log(`[slice-package-audit] Saved: ${reportPath}`);
}

main();
