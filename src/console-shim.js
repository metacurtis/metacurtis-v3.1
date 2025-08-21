// @doctor:4b-disposers
const __doctorDisposers = []; // src/console-shim.js
const originalConsoleError = console.error;
console.error = (...args) => {
  const safe = args.map((arg) => {
    if (arg instanceof Error) {
      return `Error: ${arg.message}\nStack:\n${arg.stack}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, Object.getOwnPropertyNames(arg), 2);
      } catch {
        return `[Unserializable Object: ${String(arg)}]`;
      }
    }
    return String(arg);
  });
  originalConsoleError.apply(console, safe);
}; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}