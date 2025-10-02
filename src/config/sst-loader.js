// Example: Using SST with JSDoc type checking

const { loadSST } = require('../types/sst-types');

/** @type {import('../types/sst-types').SSTConfig} */
const SST = loadSST();

// IDE autocomplete examples
console.log(SST.visual.letterGeometry.genesis.word);
console.log(SST.performance.frameRate.target);

const genesisConfig = SST.visual.letterGeometry.genesis;
console.log(`Genesis: "${genesisConfig.word}" with ${genesisConfig.particlesPerLetter} particles/letter`);

module.exports = SST;
