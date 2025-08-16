/**
 * @typedef {Object} StateSnapshot
 * @property {number} stage
 * @property {number} morph
 * @property {number} particleCount
 * @property {{fps:number, frameTime?:number}} perf
 * @property {{tiers:boolean, perf:boolean}} debug
 */
/**
 * @typedef {Object} StatePort
 * @property {()=>StateSnapshot} get
 * @property {(fn:(s:StateSnapshot)=>void)=>()=>void} subscribe
 */
export {};
