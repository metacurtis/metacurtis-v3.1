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
