#!/usr/bin/env node

const path = require('path');
const { pathToFileURL } = require('url');

async function loadContracts() {
  const modulePath = path.resolve('src/contracts/OptimizedContracts.js');
  const mod = await import(pathToFileURL(modulePath).href);
  return mod;
}

function createTestHarness() {
  const tests = [];

  function test(name, fn) {
    tests.push({ name, fn });
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async function run() {
    let passed = 0;
    const failures = [];

    for (const { name, fn } of tests) {
      try {
        await fn();
        passed += 1;
        console.log(`✅ ${name}`);
      } catch (error) {
        failures.push({ name, error });
        console.error(`❌ ${name}`);
        console.error(error.stack || error.message);
      }
    }

    console.log('\nContract test summary:', `${passed}/${tests.length} passed`);

    if (failures.length) {
      process.exitCode = 1;
    }
  }

  return { test, assert, run };
}

(async () => {
  const { test, assert, run } = createTestHarness();
  const { BeatBusContract, BlueprintContract, CacheKeyGenerator } = await loadContracts();

  const sampleBlueprint = {
    positions: new Float32Array([0, 0, 0, 1, 1, 1]),
    particleCount: 2,
    mode: 'genesis'
  };

  test('BeatBusContract enforces BLUEPRINT_READY shape', () => {
    const payload = {
      blueprint: sampleBlueprint,
      stage: 'genesis',
      quality: 'HIGH'
    };

    const result = BeatBusContract.enforceShape('BLUEPRINT_READY', payload);
    assert(result.blueprint === sampleBlueprint, 'blueprint forwarded');
    assert(result.stage === 'genesis', 'stage forwarded');
    assert(result.quality === 'HIGH', 'quality forwarded');
  });

  test('BeatBusContract throws when required field missing', () => {
    const payload = { stage: 'genesis', quality: 'HIGH' };
    let threw = false;
    try {
      BeatBusContract.enforceShape('BLUEPRINT_READY', payload);
    } catch (error) {
      threw = true;
      assert(/Missing required field/.test(error.message), 'error references missing field');
    }
    assert(threw, 'expected enforceShape to throw');
  });

  test('BlueprintContract validates matching positions and count', () => {
    assert(BlueprintContract.validate(sampleBlueprint), 'blueprint should be valid');
  });

  test('BlueprintContract rejects mismatched counts', () => {
    const invalid = { ...sampleBlueprint, particleCount: 3 };
    assert(!BlueprintContract.validate(invalid), 'blueprint should be invalid');
  });

  test('CacheKeyGenerator produces deterministic md5 hash', () => {
    const params = { blueprint: { id: 'abc', stage: 'genesis' }, schema: 'blueprint-event' };
    const hashA = CacheKeyGenerator.generate(params);
    const hashB = CacheKeyGenerator.generate(params);
    assert(hashA === hashB, 'hash should be deterministic');
    assert(hashA.length === 32, 'hash should be md5 length');
  });

  await run();
})();
