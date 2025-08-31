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
