// ESM-compatible SST loader that keeps default export expectations across Node & Vite

/** @typedef {import('../types/sst-types').SSTConfig} SSTConfig */

let sstConfig;

if (typeof process !== 'undefined' && process.versions?.node) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const primaryPath = path.resolve(__dirname, '../../sst/canon/v3.5.runtime.json');
  const fallbackPath = path.resolve(__dirname, './canonical/sst-v3.3.json');

  try {
    const raw = await fs.readFile(primaryPath, 'utf8');
    sstConfig = JSON.parse(raw);
    console.log('📋 SST v3.5 runtime loaded');
  } catch (error) {
    console.warn('⚠️ SST v3.5 runtime failed; falling back to v3.3:', error?.message || error);
    const raw = await fs.readFile(fallbackPath, 'utf8');
    sstConfig = JSON.parse(raw);
    console.log('📋 SST v3.3 loaded (fallback)');
  }
} else {
  try {
    const module = await import('../../sst/canon/v3.5.runtime.json');
    sstConfig = module.default || module;
    console.log('📋 SST v3.5 runtime loaded');
  } catch (error) {
    console.warn('⚠️ SST v3.5 runtime failed; falling back to v3.3:', error?.message || error);
    const module = await import('./canonical/sst-v3.3.json');
    sstConfig = module.default || module;
    console.log('📋 SST v3.3 loaded (fallback)');
  }
}

/**
 * Load the canonical SST configuration.
 * @returns {SSTConfig}
 */
export const loadSST = () => sstConfig;

export default sstConfig;
