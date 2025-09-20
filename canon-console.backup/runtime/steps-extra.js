// canon-console/runtime/steps-extra.js
export const ExtraSteps = {
  set_draw_range_from_uniforms({ geometry, material }) {
    try {
      const active = material?.uniforms?.uActiveCount?.value ?? geometry?.attributes?.particleIndex?.count ?? 0;
      if (typeof active === 'number' && geometry?.setDrawRange) {
        geometry.setDrawRange(0, active);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  convert_tiers_to_tierData({ blueprint }) {
    try {
      if (blueprint?.tiers && !blueprint.tierData) {
        blueprint.tierData = new Float32Array(blueprint.tiers);
        return { ok: true, changed: true };
      }
      return { ok: true, changed: false };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
