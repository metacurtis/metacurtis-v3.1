# ZAG Incident Audit — landing_stage Black Screen

## 1) Repro URL
`http://localhost:5173/?slice=landing_stage&preset=agency_dark&deterministic=1&seed=123&quality=HIGH`

## 2) Raw grep outputs (A–E)
```text
A) rg -n "addEventListener\('scroll'" src
src/theater/ScrollOrchestrator.js:78:      window.addEventListener('scroll', this._onScroll, { passive: true });

B) rg -n "\bemitMorphProgress\(" src
src/theater/controllers/MorphAnimationController.js:27:    emitMorphProgress({
src/theater/controllers/MorphAnimationController.js:68:      emitMorphProgress({
src/theater/bus/emitters.js:58:export function emitMorphProgress(payload) {

C) rg -n "jumpToStage\(" src/state/commands src/theater

D) rg -n "slice=landing_stage|landingStageSliceResolved|landing_preset_profiles|landing_stage_slice__|demoKey|choreoKey" src sst
src/theater/disableDirectorAutostart.js:16:    const demoKey = urlParams.get('demo');
src/theater/disableDirectorAutostart.js:18:    if (demoKey) {
src/theater/disableDirectorAutostart.js:20:      globalThis.__DEMO_KEY__ = demoKey;
src/theater/disableDirectorAutostart.js:21:      console.log(`[DisableAutostart] Demo mode enabled: ${demoKey}`);
src/theater/VisualOrchestrator.js:40:      demoKey: (typeof globalThis !== 'undefined' && globalThis.__DEMO_KEY__) || null,
src/theater/VisualOrchestrator.js:122:    const demoKey =
src/theater/VisualOrchestrator.js:123:      (typeof globalThis !== 'undefined' && globalThis.__DEMO_KEY__) || this.state.demoKey || null;
src/theater/VisualOrchestrator.js:124:    if (phase === 'visual_demo' && demoKey && demoKey !== this.state.demoKey) {
src/theater/VisualOrchestrator.js:125:      this.state.demoKey = demoKey;
src/theater/VisualOrchestrator.js:127:    const isBrandVisionDemo = phase === 'visual_demo' && demoKey === 'brand_vision_demo';
src/theater/TheaterDirector.js:585:  _enableDemoInteractive(demoKey, demo = {}) {
src/theater/TheaterDirector.js:617:      BeatBus.emit('DEMO_INTERACTIVE_READY', { demo: demoKey, source: 'demo' });
src/theater/TheaterDirector.js:882:  runVisualDemo(demoKey = 'brand_vision_demo') {
src/theater/TheaterDirector.js:893:    const demo = Canonical?.visualDemos?.[demoKey];
src/theater/TheaterDirector.js:895:      throw new Error(`[TheaterDirector] visual demo not found: ${demoKey}`);
src/theater/TheaterDirector.js:897:    const isIntentDemo = demoKey === 'demo_intent_v2';
src/theater/TheaterDirector.js:898:    const useDefaultDemoCameras = demoKey === 'brand_vision_demo';
src/theater/TheaterDirector.js:907:      this._lockScroll?.({ source: 'visual_demo', key: demoKey });
src/theater/TheaterDirector.js:935:          source: `visual_demo:${demoKey}`,
src/theater/TheaterDirector.js:952:          source: `visual_demo:${demoKey}`,
src/theater/TheaterDirector.js:976:            source: `visual_demo:${demoKey}:endcard`,
src/theater/TheaterDirector.js:993:            this._enableDemoInteractive(demoKey, demo);
src/theater/TheaterDirector.js:996:        this._unlockScroll?.({ source: 'visual_demo', key: demoKey });
src/theater/TheaterDirector.js:1004:        this._unlockScroll?.({ source: 'visual_demo', key: demoKey });
src/components/dev/DemoLauncher.jsx:144:    const resolved = Canonical?.landingStageSliceResolved || {};
src/components/dev/DemoLauncher.jsx:165:  const buildUrl = (demoKey) => {
src/components/dev/DemoLauncher.jsx:175:    url.searchParams.set('demo', demoKey);
src/components/dev/DemoLauncher.jsx:195:  const launchDemo = (demoKey) => {
src/components/dev/DemoLauncher.jsx:196:    const url = buildUrl(demoKey);
src/components/dev/DemoLauncher.jsx:205:  const copyDemoUrl = async (demoKey) => {
src/components/dev/DemoLauncher.jsx:206:    const url = buildUrl(demoKey);
src/components/dev/DemoLauncher.jsx:274:                <div style={metaStyle}>slice=landing_stage</div>
src/components/landing/LandingOverlay.jsx:47:  const landingResolved = Canonical?.landingStageSliceResolved || {};
src/engine/utils/blueprintUtils.js:188:    const demoKey = typeof globalThis !== 'undefined' ? globalThis.__DEMO_KEY__ : null;
src/engine/utils/blueprintUtils.js:189:    const demoWord = demoKey ? Canonical?.visualDemos?.[demoKey]?.word : null;
src/components/consciousness/ConsciousnessTheater.jsx:28:const isLandingSliceDemoKey = (demoKey) =>
src/components/consciousness/ConsciousnessTheater.jsx:29:  typeof demoKey === 'string' &&
src/components/consciousness/ConsciousnessTheater.jsx:30:  (demoKey === LANDING_SLICE_DEMO_KEY || demoKey.startsWith(LANDING_SLICE_DEMO_KEY_PREFIX));
src/components/consciousness/ConsciousnessTheater.jsx:208:  const demoKey =
src/components/consciousness/ConsciousnessTheater.jsx:210:  const isLandingSliceDemo = isLandingSliceDemoKey(demoKey);
src/components/consciousness/ConsciousnessTheater.jsx:317:          ? (Canonical?.landingStageSliceResolved?.demoKey || LANDING_SLICE_DEMO_KEY)
src/App.jsx:49:            Canonical?.landingStageSliceResolved?.quality ||
src/config/canonical/canonicalAuthority.js:28:const LANDING_PRESET_PROFILES_KEY = 'landing_preset_profiles';
src/config/canonical/canonicalAuthority.js:82:function getResolvedLandingDemoKey(choreoKey = null) {
src/config/canonical/canonicalAuthority.js:83:  if (typeof choreoKey === 'string' && choreoKey.trim()) {
src/config/canonical/canonicalAuthority.js:84:    return `${LANDING_SLICE_DEMO_RESOLVED_PREFIX}${choreoKey.trim()}`;
src/config/canonical/canonicalAuthority.js:385:  const landingStageSliceResolved = landingStageSlice.enabled
src/config/canonical/canonicalAuthority.js:421:  if (landingStageSliceResolved.enabled) {
src/config/canonical/canonicalAuthority.js:430:      landingStageSliceResolved.preset &&
src/config/canonical/canonicalAuthority.js:432:      landingPresetProfiles[landingStageSliceResolved.preset]
src/config/canonical/canonicalAuthority.js:433:        ? landingStageSliceResolved.preset
src/config/canonical/canonicalAuthority.js:443:    const resolvedDemo = materializeLandingDemo(demoTemplate, landingStageSliceResolved);
src/config/canonical/canonicalAuthority.js:448:    landingStageSliceResolved.choreoKey = presetChoreoKey;
src/config/canonical/canonicalAuthority.js:449:    landingStageSliceResolved.demoKey = resolvedDemoKey;
src/config/canonical/canonicalAuthority.js:455:        preset: landingStageSliceResolved.preset || null,
src/config/canonical/canonicalAuthority.js:456:        stage: landingStageSliceResolved.stage,
src/config/canonical/canonicalAuthority.js:457:        sourceStage: landingStageSliceResolved.sourceStage,
src/config/canonical/canonicalAuthority.js:458:        word: landingStageSliceResolved.word,
src/config/canonical/canonicalAuthority.js:459:        ...(landingStageSliceResolved.palette ? { palette: landingStageSliceResolved.palette.slice(0, 3) } : {}),
src/config/canonical/canonicalAuthority.js:460:        particlesBase: landingStageSliceResolved.particlesBase,
src/config/canonical/canonicalAuthority.js:461:        tierMix: landingStageSliceResolved.tierMix.slice(0, 4),
src/config/canonical/canonicalAuthority.js:462:        ...(landingStageSliceResolved.quality ? { quality: landingStageSliceResolved.quality } : {}),
src/config/canonical/canonicalAuthority.js:463:        choreoKey: presetChoreoKey,
src/config/canonical/canonicalAuthority.js:464:        demoKey: resolvedDemoKey,
src/config/canonical/canonicalAuthority.js:689:    if (landingStageSliceResolved?.enabled !== true) return null;
src/config/canonical/canonicalAuthority.js:690:    if (stageName !== landingStageSliceResolved.stage) return null;
src/config/canonical/canonicalAuthority.js:692:      word: landingStageSliceResolved.word,
src/config/canonical/canonicalAuthority.js:693:      palette: landingStageSliceResolved.palette ? landingStageSliceResolved.palette.slice(0, 3) : null,
src/config/canonical/canonicalAuthority.js:694:      tierMix: landingStageSliceResolved.tierMix ? landingStageSliceResolved.tierMix.slice(0, 4) : null,
src/config/canonical/canonicalAuthority.js:695:      particlesBase: landingStageSliceResolved.particlesBase,
src/config/canonical/canonicalAuthority.js:696:      quality: landingStageSliceResolved.quality || null,
src/config/canonical/canonicalAuthority.js:697:      preset: landingStageSliceResolved.preset || null,
src/config/canonical/canonicalAuthority.js:830:    landingStageSliceResolved,
sst/canon/v3.5.runtime.json:950:    "landing_preset_profiles": {

E) rg -n "__DETERMINISTIC_MODE__|uTime\.value|timeTickEnabledRef|uPostMorphFreeze|deterministicRuntime" src
src/components/webgl/WebGLBackground.jsx:457:  const timeTickEnabledRef = useRef(true);
src/components/webgl/WebGLBackground.jsx:980:      if (uniforms?.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
src/components/webgl/WebGLBackground.jsx:981:        uniforms.uPostMorphFreeze.value = 1.0;
src/components/webgl/WebGLBackground.jsx:1054:          freeze: uniforms.uPostMorphFreeze?.value ?? null,
src/components/webgl/WebGLBackground.jsx:2082:      const freezeUniform = mat?.uniforms?.uPostMorphFreeze;
src/components/webgl/WebGLBackground.jsx:2143:            if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
src/components/webgl/WebGLBackground.jsx:2153:          if (u.uPostMorphFreeze) {
src/components/webgl/WebGLBackground.jsx:2154:            u.uPostMorphFreeze.value = 0.0;
src/components/webgl/WebGLBackground.jsx:2155:            u.uPostMorphFreeze.needsUpdate = true;
src/components/webgl/WebGLBackground.jsx:2327:          const freezeNext = matNext?.uniforms?.uPostMorphFreeze;
src/components/webgl/WebGLBackground.jsx:2340:        if (uniformsNow?.uPostMorphFreeze) {
src/components/webgl/WebGLBackground.jsx:2341:          uniformsNow.uPostMorphFreeze.value = 0;
src/components/webgl/WebGLBackground.jsx:2342:          uniformsNow.uPostMorphFreeze.needsUpdate = true;
src/components/webgl/WebGLBackground.jsx:2363:        timeTickEnabledRef.current = true;
src/components/webgl/WebGLBackground.jsx:2383:        if (uniforms?.uPostMorphFreeze) {
src/components/webgl/WebGLBackground.jsx:2384:          uniforms.uPostMorphFreeze.value = 1;
src/components/webgl/WebGLBackground.jsx:2385:          uniforms.uPostMorphFreeze.needsUpdate = true;
src/components/webgl/WebGLBackground.jsx:2451:        timeTickEnabledRef.current = false;
src/components/webgl/WebGLBackground.jsx:3084:    if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 0.0) {
src/components/webgl/WebGLBackground.jsx:3085:      uniforms.uPostMorphFreeze.value = 0.0;
src/components/webgl/WebGLBackground.jsx:3131:        if (allowAutoFreeze && uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
src/components/webgl/WebGLBackground.jsx:3132:          uniforms.uPostMorphFreeze.value = 1.0;
src/components/webgl/WebGLBackground.jsx:3201:          uPostMorphFreeze: { value: 0.0 },
src/components/webgl/WebGLBackground.jsx:3486:      typeof window !== 'undefined' && window.__DETERMINISTIC_MODE__ === true;
src/components/webgl/WebGLBackground.jsx:3488:      timeTickEnabledRef.current = false;
src/components/webgl/WebGLBackground.jsx:3489:      if (mat.uniforms.uPostMorphFreeze) {
src/components/webgl/WebGLBackground.jsx:3490:        mat.uniforms.uPostMorphFreeze.value = 1.0;
src/components/webgl/WebGLBackground.jsx:3491:        mat.uniforms.uPostMorphFreeze.needsUpdate = true;
src/components/webgl/WebGLBackground.jsx:3494:        mat.uniforms.uTime.value = 0.0;
src/components/webgl/WebGLBackground.jsx:3497:    if (timeTickEnabledRef.current && mat.uniforms.uTime) {
src/components/webgl/WebGLBackground.jsx:3498:      mat.uniforms.uTime.value = state.clock.elapsedTime;
src/components/webgl/WebGLBackground.jsx:3587:      timeTickEnabledRef.current ||
src/shaders/templates/consciousness-vertex.glsl:27:uniform float uPostMorphFreeze;
src/shaders/templates/consciousness-vertex.glsl:159:  float freeze = (uPostMorphFreeze > 0.5) ? 0.0 : 1.0;
src/shaders/templates/consciousness-vertex.glsl:182:  if (uPostMorphFreeze > 0.5) {
src/main.jsx:2:import './bootstrap/deterministicRuntime.js';
src/bootstrap/deterministicRuntime.js:1:// src/bootstrap/deterministicRuntime.js
src/bootstrap/deterministicRuntime.js:57:  window.__DETERMINISTIC_MODE__ = true;
```

## 3) Runtime probe outputs (1–5)
Captured against the repro URL while screen was black.

```text
Probe 1
{
  "hasCanvas": true,
  "cssW": 1440,
  "cssH": 900,
  "w": 1440,
  "h": 900
}

Probe 2
{
  "search": "?slice=landing_stage&preset=agency_dark&deterministic=1&seed=123&quality=HIGH",
  "landingResolved": {
    "enabled": true,
    "preset": "agency_dark",
    "stage": "architecture",
    "word": "FORM",
    "palette": [
      "#111827",
      "#1F2937",
      "#93C5FD"
    ],
    "quality": "HIGH",
    "tierMix": [
      0.58,
      0.22,
      0.12,
      0.08
    ],
    "particlesBase": 9000,
    "sourceStage": "architecture",
    "choreoKey": "agency_dark",
    "demoKey": "landing_stage_slice__agency_dark"
  },
  "landingModeForm": {
    "word": "FORM",
    "palette": [
      "#111827",
      "#1F2937",
      "#93C5FD"
    ],
    "particlesBase": 9000,
    "tierMix": [
      0.58,
      0.22,
      0.12,
      0.08
    ],
    "openingVerbSequence": [
      "coalesce",
      "settle"
    ],
    "ui": {
      "voidCopy": {
        "name": "Curtis Whorton",
        "title": "Creative Technologist",
        "line": "I build real-time cinematic systems for the web.",
        "cta": "If this resonates, let’s talk.",
        "ctaHref": "mailto:curtis@curtiswhorton.com"
      }
    },
    "preset": "agency_dark",
    "stage": "architecture",
    "sourceStage": "architecture",
    "quality": "HIGH",
    "choreoKey": "agency_dark",
    "demoKey": "landing_stage_slice__agency_dark",
    "lockStage": true
  },
  "demoKey": "landing_stage_slice__agency_dark",
  "demo": {
    "durationMs": 20000,
    "scrollLock": false,
    "beats": [
      {
        "atMs": 0,
        "durationMs": 5000,
        "verb": "coalesce",
        "easing": "smoothstep",
        "params": {
          "text": "FORM",
          "color": "#111827",
          "intensity": 0.14,
          "camera": {
            "position": {
              "x": 0,
              "y": -1,
              "z": 64
            },
            "fov": 98,
            "durationMs": 700
          }
        }
      },
      {
        "atMs": 5000,
        "durationMs": 7000,
        "verb": "settle",
        "easing": "smoothstep",
        "params": {
          "text": "FORM",
          "color": "#1F2937",
          "intensity": 0.1,
          "camera": {
            "position": {
              "x": 0,
              "y": 1,
              "z": 50
            },
            "fov": 84,
            "durationMs": 1100
          }
        }
      },
      {
        "atMs": 12000,
        "durationMs": 8000,
        "verb": "gentle_drift",
        "easing": "smoothstep",
        "params": {
          "text": "FORM",
          "color": "#93C5FD",
          "intensity": 0.07,
          "camera": {
            "position": {
              "x": 0,
              "y": 2,
              "z": 46
            },
            "fov": 80,
            "durationMs": 1200
          }
        }
      }
    ],
    "word": "FORM"
  }
}

Probe 3
{
  "dumpFormStateType": "function",
  "formState": {
    "camera": {
      "pos": [
        0,
        0,
        50
      ],
      "fov": 100,
      "zoom": 1,
      "near": 0.1,
      "far": 1000
    },
    "drawRange": null,
    "uniforms": null
  },
  "traceTail": [
    {
      "t": 4401.89999999851,
      "ev": "CE:EMIT",
      "mode": "emergence",
      "stage": "architecture",
      "atmoAABB": {
        "w": 4118.39990234375,
        "h": 2574
      },
      "textAABB": {
        "w": 105.88821029663086,
        "h": 28.664528846740723
      },
      "note": "Emergence endpoints separated: random atmospheric → 3D text target"
    },
    {
      "t": 4623.89999999851,
      "ev": "FENCEPOST_LISTENERS_READY",
      "channel": "renderer",
      "source": "webgl-renderer",
      "reason": "sink-mounted",
      "timestamp": 4617.39999999851,
      "_meta": {
        "version": "1.0.0",
        "sequence": 4
      }
    }
  ]
}

Probe 4
{
  "hasMaterial": false
}

Probe 5
{
  "forced": false,
  "reason": "no material/uniforms"
}

Canvas sample before
{
  "ok": true,
  "w": 64,
  "h": 64,
  "nonBlack": 0,
  "nonAlpha": 0,
  "meanRgb": 0
}

Canvas sample after
{
  "ok": true,
  "w": 64,
  "h": 64,
  "nonBlack": 0,
  "nonAlpha": 0,
  "meanRgb": 0
}

canvasDebug.getCanvasInfo()
{
  "width": 1440,
  "height": 900,
  "clientWidth": 1440,
  "clientHeight": 900,
  "webglVersion": null,
  "qualityTier": null,
  "particleCount": null
}
```

Probe 5 visibility result: **NO** (no exposed material to force).

Screenshots captured:
- `/tmp/landing_black_before.png`
- `/tmp/landing_black_after_probe5.png`
- `/home/curtis/projects/metacurtis-v3.1/test-results/zag-runtime-probes-ZAG-run-909eb-landing-black-screen-probes-chromium/zag-before-probe5.png`
- `/home/curtis/projects/metacurtis-v3.1/test-results/zag-runtime-probes-ZAG-run-909eb-landing-black-screen-probes-chromium/zag-after-probe5.png`

## 4) Root cause summary (single sentence)
The landing deterministic path could bind a blueprint but remain on the fallback `<pointsMaterial>` render branch because shader material creation mutated refs without a guaranteed rerender, and in parallel the demo emergence event was emitted before renderer readiness in some runs, causing missed `BLUEPRINT_READY` delivery.

## 5) Evidence table
| Hypothesis | Supported? | Evidence |
|---|---|---|
| H1 Canvas/layout issue | NO | Probe 1 shows valid canvas size (`1440x900` CSS and buffer); canvas container is fixed fullscreen (`src/components/webgl/WebGLCanvas.jsx:439-449`). |
| H2 Demo/choreo mis-resolution | NO | Probe 2 resolves `demoKey: landing_stage_slice__agency_dark` and a non-empty demo beat list; canonical landing materialization is present in `materializeLandingDemo` + `landingStageSliceResolved` (`src/config/canonical/canonicalAuthority.js:89-108`, `385-474`). |
| H3 Deterministic freeze locks before fade-in | NO (not primary) | Deterministic freeze logic exists (`src/components/webgl/WebGLBackground.jsx:3483-3494`) but pre-fix Probe 3 reported `drawRange: null` and `uniforms: null`, so nothing was actively drawn yet. |
| H4 Particles drawn but invisible (alpha/size/colors) | NO (not primary) | Mandatory Probe 4/5 could not run due no `window.__consciousnessMaterial`; however pre-fix Probe 3 had null drawRange/uniforms (no active render path). Post-fix runtime checks showed active drawRange/uniform values with no invariant changes. |
| H5 Camera/frustum/clipping issue | NO | With bound data, camera and draw counts are sane (`drawRange.count=9000`, camera z/fov from Probe 3); WebGLBackground uses `frustumCulled={false}` (`src/components/webgl/WebGLBackground.jsx:3654-3659`). |
| H6 Shader compile/runtime warnings | NO compile/runtime fatal | Console captured no WebGL fatal errors; only SwiftShader warnings; after final fix shader compile event appears and visual suites pass. |

Additional grounded runtime evidence used for diagnosis:
- Initial black capture: Probe 3 returned `drawRange: null`, `uniforms: null`.
- Intermediate run (after sink-order patch): bind log present (`✅ Renderer: BR(emergence) bound count=9000 quality=HIGH`) while `Probe 4` still `hasMaterial:false` and no forced-visibility path.
- Code path causing fallback lock: fallback condition requires `materialRef.current` in render (`src/components/webgl/WebGLBackground.jsx:3642-3651`), while material is created in effect (`3178-3269`) and, prior to fix, had no guaranteed rerender trigger.

## 6) Minimal fix plan
Implemented minimal changes:

1. **Order emergence emission after renderer readiness in landing demo boot**
- File: `src/components/consciousness/ConsciousnessTheater.jsx`
- Lines: `356-489` (current)
- Change: Introduced `requestEmergenceBlueprint()` gate and called it only when renderer readiness is confirmed (`checkRendererReady`, `FENCEPOST_LISTENERS_READY`, timeout fallback).
- Why: Removes race where `BUILD_EMERGENCE_BLUEPRINT` could fire before sink listeners were online.

2. **Force rerender when shader material is first created so renderer exits fallback branch**
- File: `src/components/webgl/WebGLBackground.jsx`
- Lines: state add `560-565`, material creation `3266-3269`, fallback gate `3642-3644`.
- Change: Added `materialReady` state, set true when material is created, and included it in fallback condition.
- Why: Guarantees React rerenders from fallback `<pointsMaterial>` into shader-backed `<points>` once `materialRef.current` exists.

Why invariants remain preserved:
- Exactly one scroll binder: unchanged (`ScrollOrchestrator` only; grep A unchanged).
- `stageAtom` authority: unchanged; no stage/progress writers added.
- Renderer sink-only: no new non-render intent emitters introduced.
- Navigation canonical authority: untouched.
- `MORPH_PROGRESS` direct publisher: unchanged (`MorphAnimationController` only callsites; grep B unchanged).

## 7) Verification gates run
Executed and results:

1. `PLAYWRIGHT_HTML_OPEN=never npm run test:visual:landing`
- Result: **PASS** (`4 passed`)

2. `PLAYWRIGHT_HTML_OPEN=never npm run test:visual`
- Result: **PASS** (`14 passed`)

3. `npx vite build`
- Result: **PASS** (`✓ built in 6.21s`)

4. Invariant greps
- `rg -n "addEventListener\('scroll'" src`
  - `src/theater/ScrollOrchestrator.js:78: window.addEventListener('scroll', this._onScroll, { passive: true });`
- `rg -n "\bemitMorphProgress\(" src`
  - `src/theater/controllers/MorphAnimationController.js:27`
  - `src/theater/controllers/MorphAnimationController.js:68`
  - `src/theater/bus/emitters.js:58`
- `rg -n "jumpToStage\(" src/state/commands src/theater`
  - no matches

## 8) Rollback plan
Safe rollback options:

1. If change is not yet committed, revert only the touched files:
- `git checkout -- src/components/consciousness/ConsciousnessTheater.jsx src/components/webgl/WebGLBackground.jsx docs/playbooks/ZAG_black_screen_landing_stage.md`

2. If committed, revert by commit SHA:
- `git revert <sha>`

3. Re-run verification gates after rollback:
- `PLAYWRIGHT_HTML_OPEN=never npm run test:visual:landing`
- `npx vite build`
- invariant greps A/B/C
