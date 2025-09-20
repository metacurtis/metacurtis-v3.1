// src/canon/hud.js — legacy HUD neutralizer (no-op; idempotent)
(function () {
  if (typeof window === 'undefined') return;
  const hide = () => { try { const el = document.getElementById('canon-hud'); if (el) el.style.display = 'none'; } catch {} };
  if (window.__canonHudV2__) { hide(); return; }
  hide();
  if (!window.LegacyCanonHud) window.LegacyCanonHud = { show:()=>{}, hide, isActive:()=>false };
})();
export default {};
