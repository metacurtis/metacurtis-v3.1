/** @typedef {{type:string, payload?:any}} Command */

/**
 * @param {Record<string,(cmd:Command, ctx:{state:any})=>any>} handlers
 */
export function createCommandBus(handlers = {}) {
  const table = new Map(Object.entries(handlers));
  return {
    register(type, fn) { table.set(type, fn); },
    unregister(type) { table.delete(type); },
    clear() { table.clear(); },
    /** @param {Command} cmd */
    dispatch(cmd, ctx) {
      const fn = table.get(cmd.type);
      if (!fn) { console.warn('[CommandBus] no handler for', cmd.type); return; }
      return fn(cmd, ctx);
    }
  };
}
