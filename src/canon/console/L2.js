// [CANON:CONSOLE:L2]
import { CanonConsoleL1 } from './L1.js'; // @doctor:4b-disposers
const __doctorDisposers = [];export class CanonConsoleL2 extends CanonConsoleL1 {
  constructor() {super();this.context = null;this.filters = {};}
  setContext(ctx) {this.context = ctx;this.filters = ctx === 'morphing' ? { show: ['morph', 'uniform', 'progress'], hide: ['network'] } : {};}
  suggestFixFrom(args) {
    const s = String(args?.[0] || '');
    if (/uniform .* not found/i.test(s)) return { script: 'doctor_add_uniforms.cjs', reason: 'Missing uniform' };
    if (/fragmentShaderSource:|vertexShaderSource:/i.test(s)) return { script: 'doctor_fix_shader_keys.cjs', reason: 'Wrong ShaderMaterial props' };
    return null;
  }
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}