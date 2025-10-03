// ESM-compatible SST loader that keeps default export expectations

import sstConfig from '../../sst/canon/v3.5.json' assert { type: 'json' };

/** @typedef {import('../types/sst-types').SSTConfig} SSTConfig */

/**
 * Load the canonical SST configuration.
 * @returns {SSTConfig}
 */
export const loadSST = () => sstConfig;

export default sstConfig;
