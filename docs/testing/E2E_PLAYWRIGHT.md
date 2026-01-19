# E2E Testing (Playwright) - Scope and Usage

This repo uses Playwright for end-to-end (E2E) validation of the WebGL experience and critical orchestration invariants. The tests live under `tests/visual` and run against the dev server.

## Quick Start

Install browser once per machine:
```
npx playwright install chromium
```

Run all visual E2E tests:
```
npm run test:visual
```

Run a single spec or a subset:
```
npm run test:visual -- --grep technologist
```

Interactive UI mode:
```
npm run test:visual:ui
```

Debug mode (headed):
```
npm run test:visual:debug
```

View the last HTML report:
```
npx playwright show-report
```

## What E2E Covers Today

Test entry point and config:
- `playwright.config.js` uses `baseURL: http://localhost:5173` and starts `npm run dev`.
- Artifacts on failure: screenshot, video, trace (see `test-results/` and `playwright-report/`).

Current specs (in `tests/visual`):
- `opening-sequence.spec.ts`
  - Fencepost contract and stage bind ordering.
  - No late directives after fencepost.
  - Morph settles and remains stable post-fencepost.
  - Text geometry AABB stability across frames.
- `debug-globals.spec.ts`
  - Confirms dev globals exist over time (director, trace, BeatBus, probe).
- `debug-trace-tags.spec.ts`
  - Dumps actual trace tags and confirms fencepost/emergence/stage markers.
- `demo-technologist.spec.ts`
  - Demo mode boot for `demo_technologist`.
  - Reads text3DPosition AABB from renderer diagnostics.
  - Confirms text fits viewport and has real depth.

## Runtime Diagnostics Surfaces Used by E2E

These are safe to query in tests (and in the browser console):
- `window.__trace`, `window.dumpTrace()`, `window.clearTrace()`
  - Core trace buffer used by fencepost and stage bind checks.
- `window.__rendererDiagnostics`
  - Control surface exposed by WebGLBackground.
  - Methods used in tests:
    - `getAttributeArray('text3DPosition')`
    - `getUniformValue(name)`
    - `getActiveCount()`
    - `getDrawCount()`
- `window.__cameraDebug`
  - `getCamera()`, `getTarget()`, `forceMove(z, fov)`
- `window.__viewportHint`
  - Renderer-computed viewport dimensions.
- Demo mode globals:
  - `window.__DEMO_MODE__`, `window.__DEMO_KEY__`, `window.__LAST_TEXT_MORPH_WORD__`

If a test needs a new signal, prefer exposing it through:
- `exposeControlSurface` (guarded surface, `src/utils/runtimeGuards.js`)
- or trace events via `src/dev/trace.js`

## Demo Mode Testing

Demo mode is enabled via URL query:
```
/?demo=demo_technologist&autoplay=1&delay=300
```

Use the helper in `tests/visual/helpers.ts`:
- `waitForDemoReady(page, { demoKey, word })`
  - Waits for demo mode, expected word, renderer diagnostics, and viewport hint.

Note: Demo mode bypasses opening/narration. Do not use `waitForTheaterReady` for demo tests.

## Capabilities You Can Lean On

These are the capabilities already proven by tests and runtime surfaces:
- Verify fencepost and stage bind ordering deterministically.
- Validate morph progression and stability (no late directive flicker).
- Inspect actual particle geometry attributes (e.g., text3DPosition AABB).
- Inspect camera state and target state for camera path debugging.
- Capture trace tags to locate lifecycle divergence.
- Run isolated demo flows via query params to reproduce issues.

## How to Get the Most Out of E2E (Debug Hours Saved)

Pattern:
1) Create or reuse a demo route that reproduces the issue.
2) Add a small Playwright spec that:
   - Boots the demo route.
   - Waits for readiness.
   - Samples renderer state (geometry AABB, uniforms, camera).
   - Asserts the invariant you care about.
3) Run the spec and attach the output to the debugging thread.

When a bug is found:
- Capture `test-results/...` artifacts (screenshot/video).
- Copy the console metrics that Playwright prints (AABB, ratios, etc).
- Provide the spec name and the invariant that failed.

This gives AI chats concrete, falsifiable evidence instead of assumptions.

## Common Pitfalls (and Fixes)

- Demo tests hanging on fencepost:
  - Use `waitForDemoReady`, not `waitForTheaterReady`.
- Audio assets slowing tests:
  - Stub mp3 with `page.route('**/*.mp3', ...)` as in existing specs.
- Trace not ready:
  - Use `dumpTrace()` and log trace tags in the spec.
- Missing diagnostics surface:
  - Ensure `__rendererDiagnostics` is exposed before accessing.

## Adding a New E2E Test

Checklist:
- Place spec under `tests/visual`.
- Use existing helpers (`waitForTheaterReady`, `waitForDemoReady`).
- Avoid direct DOM polling; prefer runtime diagnostics/trace.
- Keep assertions deterministic and numerically bounded.

Example skeleton:
```
import { test, expect } from '@playwright/test';
import { waitForDemoReady } from './helpers';

test('demo_x fits within viewport', async ({ page }) => {
  await page.goto('/?demo=demo_x&autoplay=1');
  await waitForDemoReady(page, { demoKey: 'demo_x', word: 'X' });

  const metrics = await page.evaluate(() => {
    const diag = window.__rendererDiagnostics;
    const positions = diag?.getAttributeArray?.('text3DPosition');
    // compute AABB...
    return { width: 0, height: 0, depth: 0 };
  });

  expect(metrics).toBeTruthy();
  expect(metrics.depth).toBeGreaterThan(0.5);
});
```

## Reference Paths

- Tests: `tests/visual`
- Config: `playwright.config.js`
- Helpers: `tests/visual/helpers.ts`
- Demo launcher: `src/components/dev/DemoLauncher.jsx`
- Demo gate: `src/components/consciousness/ConsciousnessTheater.jsx`
- Renderer diagnostics: `src/components/webgl/WebGLBackground.jsx`
