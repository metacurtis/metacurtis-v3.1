// DEV alias: make stageControls.set(..) call stateControls.setStage(..)
(function(){
  if (!import.meta.env.DEV) return;
  const sc = globalThis.stateControls || globalThis.stageControls;
  if (!sc) { console.warn('stageControlsAlias: stateControls missing'); return; }
  const alias = {
    set: (name)=> sc.setStage?.(name) ?? (globalThis.CANON_BEATBUS?.emit?.('STAGE_CHANGE',{stage:name,source:'alias'}), name),
    setStage: (name)=> sc.setStage?.(name),
    get: ()=> sc.getStage?.(),
    getStage: ()=> sc.getStage?.(),
  };
  globalThis.stageControls = Object.assign({}, globalThis.stageControls || {}, sc || {}, alias);
  console.log('🔗 stageControls alias wired → stageControls.set("discipline") is now valid');
})();