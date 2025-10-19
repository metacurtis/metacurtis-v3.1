# Canon Dev-OS v3.5

Production development operating system for MetaCurtis.

## Features
- Blueprint validation (prevents malformed GPU data)
- Contract validation (validates all BeatBus events)
- Field migration (automatic quality→tier conversion)
- Incident tracking (HUD shows all violations)
- Performance monitoring

## Usage
- F2: Toggle HUD
- Ctrl+H: Alternative toggle
- `window.CANON_CONSOLE.stats()`: View loaded modules
- `window.CANON_CONTRACT_TAP.getStats()`: View validation stats

## Architecture
- `browser/inject.js`: Main injector
- `runtime/blueprint-guard-v2.js`: Blueprint validation
- `runtime/contract-tap.js`: Event contract validation
- `runtime/contracts/registry.js`: Contract definitions
- `runtime/hud.js`: Visual interface
