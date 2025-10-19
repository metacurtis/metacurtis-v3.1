// Runtime guard helpers to keep control APIs behind explicit authorization
// and expose diagnostics in a read-only fashion.

const DEV =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  Boolean(import.meta.env.DEV);

function getControlToken() {
  if (typeof window === 'undefined') return null;
  const guard = window.__CANON_RUNTIME_GUARD__;
  if (guard && typeof guard.token !== 'undefined') return guard.token;
  if (window.__CANON_DEV_CONTROL_TOKEN__) return window.__CANON_DEV_CONTROL_TOKEN__;
  return null;
}

function hasLocalOptIn() {
  if (typeof window === 'undefined') return false;
  try {
    return window.__CANON_DEV_CONTROLS__ === true ||
      (window.localStorage && window.localStorage.getItem('canon:allowControls') === 'true');
  } catch {
    return false;
  }
}

/**
 * Determine if a given capability may be controlled externally.
 * @param {string} capability
 * @returns {boolean}
 */
export function isControlAllowed(capability) {
  if (typeof window === 'undefined') return false;

  const guard = window.__CANON_RUNTIME_GUARD__;
  if (guard && typeof guard.allow === 'function') {
    try {
      if (guard.allow(capability) === true) {
        return true;
      }
    } catch {
      // fall through to other checks
    }
  }

  const token = getControlToken();
  if (token === true || token === 'allow-control' || token === capability) {
    return true;
  }

  return DEV && hasLocalOptIn();
}

/**
 * Wrap a control function so that it executes only when permitted.
 * @param {string} capability
 * @param {Function} fn
 * @returns {Function}
 */
export function withGuard(capability, fn) {
  return (...args) => {
    if (!isControlAllowed(capability)) {
      console.warn(`[runtime-guard] Blocked unauthorized control "${capability}"`);
      return undefined;
    }
    return fn(...args);
  };
}

/**
 * Expose read-only diagnostics on `window.__CANON_DIAGNOSTICS__`.
 * Getter results are shallow-cloned to discourage mutation.
 * @param {string} name
 * @param {() => Record<string, unknown>} getter
 */
export function exposeDiagnostics(name, getter) {
  if (typeof window === 'undefined') return;

  if (!window.__CANON_DIAGNOSTICS__) {
    Object.defineProperty(window, '__CANON_DIAGNOSTICS__', {
      value: {},
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }

  Object.defineProperty(window.__CANON_DIAGNOSTICS__, name, {
    configurable: true,
    enumerable: true,
    get() {
      try {
        const snapshot = getter();
        if (!snapshot || typeof snapshot !== 'object') return snapshot;
        return Object.freeze({ ...snapshot });
      } catch (error) {
        console.warn(`[runtime-guard] diagnostics getter "${name}" failed`, error);
        return null;
      }
    },
    set() {
      console.warn(`[runtime-guard] Attempt to overwrite diagnostics "${name}" ignored.`);
    },
  });
}

/**
 * Attach a guarded control surface to `window`.
 * Controls are only attached when allowed; otherwise a diagnostics-only proxy is used.
 * @param {string} name
 * @param {() => Record<string, unknown>} factory
 * @param {Record<string,string>} capabilityMap Property → capability name
 */
export function exposeControlSurface(name, factory, capabilityMap = {}) {
  if (typeof window === 'undefined') return;

  const surface = factory();
  const proxy = {};

  Object.keys(surface).forEach((key) => {
    const value = surface[key];
    if (typeof value === 'function') {
      const capability = capabilityMap[key];
      Object.defineProperty(proxy, key, {
        configurable: true,
        enumerable: true,
        value: capability ? withGuard(capability, value) : value,
        writable: false,
      });
    } else {
      Object.defineProperty(proxy, key, {
        configurable: true,
        enumerable: true,
        get: () => surface[key],
        set: () => {
          console.warn(`[runtime-guard] Attempt to mutate read-only control "${name}.${key}" ignored.`);
        },
      });
    }
  });

  Object.freeze(proxy);
  Object.defineProperty(window, name, {
    configurable: true,
    enumerable: false,
    value: proxy,
    writable: false,
  });
}

/**
 * Remove a previously exposed control surface.
 * @param {string} name
 */
export function revokeControlSurface(name) {
  if (typeof window === 'undefined') return;
  if (Object.prototype.hasOwnProperty.call(window, name)) {
    try {
      delete window[name];
    } catch {
      // ignore deletion errors (e.g., non-configurable)
    }
  }
}

export function isDevEnvironment() {
  return DEV;
}
