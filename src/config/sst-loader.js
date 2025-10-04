// ESM-compatible SST loader that keeps default export expectations across Node & Vite

/** @typedef {import('../types/sst-types').SSTConfig} SSTConfig */

let sstConfig;

if (typeof process !== 'undefined' && process.versions?.node) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const canonicalPath = path.resolve(__dirname, '../../sst/canon/v3.5.json');
  const raw = await fs.readFile(canonicalPath, 'utf8');
  sstConfig = JSON.parse(raw);
} else {
  const module = await import('../../sst/canon/v3.5.json');
  sstConfig = module.default;
}

/**
 * Load the canonical SST configuration.
 * @returns {SSTConfig}
 */
export const loadSST = () => sstConfig;

export default sstConfig;
