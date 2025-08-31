#!/usr/bin/env bash
set -euo pipefail

ROOT="${PWD}"
DIR="src/debug/opening-debug"
mkdir -p "$DIR"

# 1) BeatBus tracer
cat > "$DIR/BeatBusTracer.js" <<'JS'
import BeatBus from "@/modules/orchestration/core/BeatBus.js";

export function installBeatBusTracer({ tag="TRACE", filter=null, perf=true } = {}) {
  if (BeatBus.__tracerInstalled) return;
  BeatBus.__tracerInstalled = true;

  const origEmit = BeatBus.emit.bind(BeatBus);
  const origOn   = BeatBus.on.bind(BeatBus);

  BeatBus.on = (evt, cb) => {
    const wrapped = (...args) => {
      if (!filter || evt.match(filter)) {
        console.log(`[%c${tag}%c] on  %c${evt}`, "color:#9EFADF", "color:inherit", "color:#FFD56B", args?.[0]||"");
      }
      return cb(...args);
    };
    return origOn(evt, wrapped);
  };

  BeatBus.emit = (evt, payload) => {
    if (!filter || evt.match(filter)) {
      const p = payload || {};
      if (perf && window.performance?.mark) performance.mark(`emit-${evt}-start`);
      console.log(`[%c${tag}%c] EMIT %c${evt}`, "color:#9EFADF", "color:inherit", "color:#7CC7FF", p);
      const out = origEmit(evt, payload);
      if (perf && window.performance?.mark) {
        performance.mark(`emit-${evt}-end`);
        performance.measure(`evt:${evt}`, `emit-${evt}-start`, `emit-${evt}-end`);
      }
      return out;
    }
    return origEmit(evt, payload);
  };

  console.log(`[${tag}] BeatBus tracer installed`);
}
JS

# 2) Debug Director (deterministic opening flow)
cat > "$DIR/DirectorDebug.js" <<'JS'
import BeatBus from "@/modules/orchestration/core/BeatBus.js";
import { EVENTS } from "@/theater/events.js";

export class DirectorDebug {
  constructor(opts = {}) {
    this.opts = {
      emergenceCount: 2000,
      morphHold: 1.0,           // keep text fully formed at start
      autoAdvanceTo: "genesis", // advance to first stage you want post-text
      autoAdvanceDelayMs: 1200, // pause while the text is visible
      ...opts,
    };
    this._tick = this._tick.bind(this);
    this._raf = null;
    this._start = 0;
    this._phase = "idle";
  }

  play() {
    BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
    BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      sourceText: "HELLO CURTIS",
      count: this.opts.emergenceCount,
    });
    this._phase = "emergence";
    this._start = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  _tick(now) {
    const t = (now - this._start) / 1000;

    if (this._phase === "emergence") {
      // smoothstep to morphHold
      const k = Math.min(1, t / 0.9);
      const v = k*k*(3-2*k) * this.opts.morphHold;
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });

      if (k >= 1) {
        this._phase = "hold";
        this._start = performance.now();
        BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      }
    } else if (this._phase === "hold") {
      if (now - this._start > this.opts.autoAdvanceDelayMs) {
        BeatBus.emit(EVENTS.PARTICLES_EMERGED);
        // re-emit stage so tint uniforms reapply immediately
        BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: this.opts.autoAdvanceTo });
        this._phase = "done";
      }
    }

    if (this._phase !== "done") this._raf = requestAnimationFrame(this._tick);
  }

  stop() { if (this._raf) cancelAnimationFrame(this._raf); }
}
JS

# 3) Probes (quick sanity checks)
cat > "$DIR/probes.js" <<'JS'
export const probes = {
  dumpUniforms() {
    const u = window.__consciousnessMaterial?.uniforms || {};
    console.log("UNIFORMS",
      "morph", u.uMorphProgress?.value,
      "pointSize", u.uPointSize?.value,
      "active", u.uActiveCount?.value
    );
  },
  dumpGeoBounds() {
    const geo = window.__particleGeometry;
    if (!geo) return console.warn("No particle geometry yet");
    const A = geo.getAttribute("atmosphericPosition");
    const T = geo.getAttribute("text3DPosition") || geo.getAttribute("allenAtlasPosition");
    const calc = (arr)=>{let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
      for (let i=0;i<arr.length;i+=3){const x=arr[i],y=arr[i+1];
        if (x<minX)minX=x;if (x>maxX)maxX=x;if (y<minY)minY=y;if (y>maxY)maxY=y;}
      return {w:+(maxX-minX).toFixed(1),h:+(maxY-minY).toFixed(1)};
    };
    console.log("BOUNDS",
      "atmos", A ? calc(A.array) : null,
      "text ", T ? calc(T.array) : null
    );
  },
  assertMorphAlignment() {
    const geo = window.__particleGeometry;
    const A = geo?.getAttribute("atmosphericPosition")?.array;
    const T = geo?.getAttribute("text3DPosition")?.array;
    if (!A || !T) return console.warn("Missing source/target attrs");
    if (A.length !== T.length) console.error("Length mismatch", A.length, T.length);
  }
};
JS

# 4) Minimal harness (Canvas + renderer under test + HUD)
cat > "$DIR/OpeningDebugHarness.jsx" <<'JSX'
import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import BeatBus from "@/modules/orchestration/core/BeatBus.js";
import { EVENTS } from "@/theater/events.js";
import engine from "@/engine/ConsciousnessEngine.js";
import WebGLBackground from "@/components/webgl/WebGLBackground.jsx";

import { installBeatBusTracer } from "./BeatBusTracer.js";
import { DirectorDebug } from "./DirectorDebug.js";
import { probes } from "./probes.js";

export default function OpeningDebugHarness() {
  const [ready, setReady] = useState(false);
  const directorRef = useRef(null);

  useEffect(() => {
    installBeatBusTracer({ tag: "OPENING", filter: null, perf: true });

    // Ensure engine kicks at least once if it has an init
    try { engine.init?.(); } catch {}

    directorRef.current = new DirectorDebug({
      morphHold: 1.0,
      emergenceCount: 2000,
      autoAdvanceTo: "genesis",
      autoAdvanceDelayMs: 1200,
    });
    directorRef.current.play();

    setTimeout(() => { probes.dumpUniforms(); probes.dumpGeoBounds(); }, 1400);
    setReady(true);
    return () => directorRef.current?.stop?.();
  }, []);

  return (
    <div style={{width:"100%",height:"100vh",background:"#000"}}>
      <Canvas gl={{ antialias: true, alpha: true }} camera={{ fov: 60, position: [0, 0, 60] }}>
        <WebGLBackground morphProgress={0} scrollProgress={0}/>
      </Canvas>
      <HUD/>
    </div>
  );
}

function HUD() {
  const [morph, setMorph] = useState(0);
  return (
    <div style={panel}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <label>Morph</label>
        <input type="range" min="0" max="1" step="0.01" value={morph}
          onChange={e=>{
            const v = parseFloat(e.target.value);
            setMorph(v);
            BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
          }}/>
        <span>{morph.toFixed(2)}</span>
      </div>
      <div style={{marginTop:6,display:"flex",gap:8}}>
        <button onClick={()=>probes.dumpUniforms()}>Dump uniforms</button>
        <button onClick={()=>probes.dumpGeoBounds()}>Dump bounds</button>
        <button onClick={()=>probes.assertMorphAlignment()}>Assert morph</button>
      </div>
    </div>
  );
}

const panel = {
  position:"fixed", left:12, bottom:12, color:"#9EFADF",
  font:"12px/16px ui-monospace, SFMono-Regular, Menlo, monospace",
  background:"rgba(0,0,0,.45)", padding:"10px 12px",
  borderRadius:8, zIndex:9999, backdropFilter:"blur(8px)"
};
JSX

echo "✅ Created debug lane in $DIR"
echo
echo "Next steps:"
echo "1) In your React app, temporarily mount the harness (pick ONE of these):"
echo "   A) Replace your App render body with:  import OpeningDebugHarness from \"$DIR/OpeningDebugHarness.jsx\";  export default function App(){ return <OpeningDebugHarness/> }"
echo "   B) If you use React Router, add a route:  <Route path=\"/debug/opening\" element={<OpeningDebugHarness/>} />"
echo "2) npm run dev, then load the page (root or /debug/opening)."
echo "3) Watch the console for [OPENING] EMIT/on logs. Use the Morph slider to verify text formation."
