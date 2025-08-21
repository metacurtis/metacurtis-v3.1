// src/console-shim.js
const originalConsoleError = console.error;

console.error = (...args) => {
  const safe = args.map(arg => {
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
};
