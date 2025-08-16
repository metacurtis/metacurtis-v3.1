/**
 * @typedef {Object} StatePort
 * @property {()=>any} get
 * @property {(patch:any | ((s:any)=>any))=>void} set
 * @property {(fn:(s:any)=>void)=>()=>void} subscribe
 */
export {};
