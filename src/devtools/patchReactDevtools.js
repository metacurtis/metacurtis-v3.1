const FALLBACK_REACT_VERSION = '18.2.0';
const PATCH_FLAG = '__metacurtisDevtoolsPatched';

function injectVersionGuard(hook) {
  if (!hook || hook[PATCH_FLAG]) return false;
  if (typeof hook.registerRenderer !== 'function') return false;

  const originalRegister = hook.registerRenderer;
  hook.registerRenderer = function patchedRegister(renderer, ...rest) {
    if (renderer && (!renderer.version || renderer.version === '')) {
      renderer.version = FALLBACK_REACT_VERSION;
    }
    return originalRegister.call(this, renderer, ...rest);
  };

  hook[PATCH_FLAG] = true;
  return true;
}

function ensureHookPatched() {
  if (typeof window === 'undefined') return true;
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  return injectVersionGuard(hook);
}

if (typeof window !== 'undefined') {
  if (!ensureHookPatched()) {
    const intervalId = setInterval(() => {
      if (ensureHookPatched()) {
        clearInterval(intervalId);
      }
    }, 500);

    window.addEventListener?.('beforeunload', () => clearInterval(intervalId));
  }
}
