// @doctor:4b-disposers
const __doctorDisposers = []; // src/stores/resourceStore.js
// Migration wrapper
export { useResourceStore } from '../hooks/atoms/useResourceStore';export { default } from '../hooks/atoms/useResourceStore'; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';
      __doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});
    });
}