export const MEMORY_FRAGMENTS = {
  genesis_terminal: {
    id:"frag_genesis_001",
    stage:"genesis",
    name:"First Code",
    trigger:{ type:"scroll", value:5, unit:"percentage", allowManual:true },
    content:{ type:"interactive", element:"commodore_terminal", size:{width:600, height:400}, position:"center" },
    duration:15000,
    dismissible:true,
    particleEffect:{
      onTrigger:{ targetTiers:[0,1], behavior:"converge", radius:200, intensity:0.7, duration:2000 }
    }
  }
};

export const FRAGMENT_INTERACTIONS = {
  terminal_emulator: {
    handler:"TerminalEmulatorHandler",
    config:{ transition:"fade", duration:500 }
  }
};

export const getFragmentsForStage = (stageName) =>
  Object.values(MEMORY_FRAGMENTS).filter(f=>f.stage===stageName);

export const getActiveFragments = (stageName, scrollPercent, narrativeSegmentId) => {
  return Object.values(MEMORY_FRAGMENTS).filter(frag=>{
    if (frag.stage !== stageName) return false;
    if (frag.trigger.type === 'scroll' &&
        Math.abs(frag.trigger.value - scrollPercent) < 2) return true;
    if (frag.trigger.type === 'narrative' &&
        frag.trigger.segmentId === narrativeSegmentId) return true;
    return false;
  });
};

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.MEMORY_FRAGMENTS = MEMORY_FRAGMENTS;
}
