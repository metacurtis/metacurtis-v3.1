// Quick verification script - save as check-critical-four.mjs
import fs from 'fs/promises';
import path from 'path';

async function checkStatus() {
  const checks = {
    events: false,
    stepsExtra: false,
    playbooksExtra: false,
    blueprintValidation: false,
    learningHook: false
  };

  // Check events
  try {
    const events = await fs.readFile('src/theater/events.js', 'utf8');
    const eventCount = (events.match(/[A-Z_]+:\s*'/g) || []).length;
    checks.events = eventCount >= 28;
    console.log(`Events: ${eventCount} defined (need 28+)`);
  } catch (e) {
    console.log('Events file error:', e.message);
  }

  // Check steps-extra
  try {
    const steps = await fs.readFile('canon-console/runtime/steps-extra.js', 'utf8');
    checks.stepsExtra = steps.includes('verify_fps_probe');
    console.log(`Steps-extra: verify_fps_probe ${checks.stepsExtra ? 'found' : 'missing'}`);
  } catch (e) {
    console.log('Steps-extra not found');
  }

  // Check playbooks-extra
  try {
    const playbooks = await fs.readFile('canon-console/runtime/playbooks-extra.js', 'utf8');
    const hasRecover = playbooks.includes('RECOVER_DIM_POINTS');
    const hasFencepost = playbooks.includes('OPENING_FENCEPOST');
    checks.playbooksExtra = hasRecover && hasFencepost;
    console.log(`Playbooks-extra: RECOVER=${hasRecover}, FENCEPOST=${hasFencepost}`);
  } catch (e) {
    console.log('Playbooks-extra not found - THIS IS THE PROBLEM');
  }

  // Check blueprint guard
  try {
    const guard = await fs.readFile('canon-console/runtime/blueprint-guard-v2.js', 'utf8');
    checks.blueprintValidation = guard.includes('__canonBlueprintValidate');
    console.log(`Blueprint validation: ${checks.blueprintValidation ? 'wired' : 'missing'}`);
  } catch (e) {
    console.log('Blueprint guard error:', e.message);
  }

  // Check learning hook
  try {
    const injector = await fs.readFile('canon-console/browser/inject.js', 'utf8');
    checks.learningHook = injector.includes('__canonLearningHook__');
    console.log(`Learning hook: ${checks.learningHook ? 'connected' : 'missing'}`);
  } catch (e) {
    console.log('Injector error:', e.message);
  }

  console.log('\nOverall status:', checks);
  return checks;
}

checkStatus();