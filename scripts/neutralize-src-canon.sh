#!/usr/bin/env bash
# Neutralize legacy src/canon/* without crashing the shell
# Usage:
#   bash scripts/neutralize-src-canon.sh
#   DRY_RUN=1 bash scripts/neutralize-src-canon.sh   # preview changes

set -Eeuo pipefail
set +o histexpand
trap 'echo "❌ Error at line $LINENO running: $BASH_COMMAND" >&2' ERR

DRY_RUN="${DRY_RUN:-0}"
BACKUP_DIR=".canon_backups"
mkdir -p "$BACKUP_DIR"

say() { printf "%b\n" "$*"; }
do_backup() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local tag ts
  ts="$(date +%s)"
  tag="${BACKUP_DIR}/$(echo "$f" | sed 's#/#__#g').bak.${ts}"
  cp -f "$f" "$tag"
  say "• backup $f -> $tag"
}
write_file() {
  local p="$1" delim="$2"
  shift 2
  if [[ "$DRY_RUN" == "1" ]]; then
    say "🔎 DRY: would write $p"
    return 0
  fi
  mkdir -p "$(dirname "$p")"
  [[ -f "$p" ]] && do_backup "$p"
  cat > "$p" <<$delim
$*
$delim
  say "✓ wrote $p"
}
sed_inplace() {
  local file="$1" expr="$2"
  if [[ "$DRY_RUN" == "1" ]]; then
    say "🔎 DRY: would sed -i '$expr' $file"
  else
    sed -i "$expr" "$file"
  fi
}

neutralize_hud() {
  local f="src/canon/hud.js"
  [[ -f "$f" ]] || { say "… skip (missing) $f"; return 0; }
  if grep -q "legacy HUD neutralizer" "$f"; then
    say "… already neutralized $f"
    return 0
  fi
  write_file "$f" EOF "// src/canon/hud.js — legacy HUD neutralizer (no-op; idempotent)
(function () {
  if (typeof window === 'undefined') return;
  const hide = () => { try { const el = document.getElementById('canon-hud'); if (el) el.style.display = 'none'; } catch {} };
  if (window.__canonHudV2__) { hide(); return; }
  hide();
  if (!window.LegacyCanonHud) window.LegacyCanonHud = { show:()=>{}, hide, isActive:()=>false };
})();
export default {};
" EOF
}

shim_init() {
  local f="src/canon/init.js"
  [[ -f "$f" ]] || { say "… skip (missing) $f"; return 0; }
  if grep -q "DEV boot shim (injector v3 only)" "$f"; then
    say "… already shimmed $f"
    return 0
  fi
  write_file "$f" EOF "// src/canon/init.js — DEV boot shim (injector v3 only)
export function bootCanonDevOs() {
  if (typeof window === 'undefined') return;
  if (import.meta?.env?.DEV) {
    import('../../canon-console/browser/inject.js');
  }
}
export default bootCanonDevOs;
" EOF
}

alias_amplified() {
  local f="src/canon/init-amplified.js"
  [[ -f "$f" ]] || { say "… skip (missing) $f"; return 0; }
  if grep -q "bootCanonDevOs" "$f"; then
    say "… already aliased $f"
    return 0
  fi
  write_file "$f" EOF "export { bootCanonDevOs as default } from './init.js';" EOF
}

stub_console() {
  local f1="src/canon/console/L1.js" f2="src/canon/console/L2.js"
  if [[ -f "$f1" ]]; then
    if grep -q "stub that delegates to CANON_CONSOLE" "$f1"; then
      say "… already stubbed $f1"
    else
      write_file "$f1" EOF "// src/canon/console/L1.js — stub that delegates to CANON_CONSOLE
export class CanonConsoleL1 {
  setLevel(l){ try{ window.CANON_CONSOLE?.setLevel?.(l); }catch{} return l; }
  mute(p){ try{ return window.CANON_CONSOLE?.mute?.(p); }catch{} return []; }
  unmute(){ try{ return window.CANON_CONSOLE?.unmute?.(); }catch{} return []; }
}
export default CanonConsoleL1;
" EOF
    fi
  else
    say "… skip (missing) $f1"
  fi
  if [[ -f "$f2" ]]; then
    if grep -q "thin extension (no extra behavior)" "$f2"; then
      say "… already stubbed $f2"
    else
      write_file "$f2" EOF "// src/canon/console/L2.js — thin extension (no extra behavior)
import CanonConsoleL1 from './L1.js';
export class CanonConsoleL2 extends CanonConsoleL1 {}
export default CanonConsoleL2;
" EOF
    fi
  else
    say "… skip (missing) $f2"
  fi
}

stub_guard() {
  local f1="src/canon/guard/L1.js" f2="src/canon/guard/L2.js"
  if [[ -f "$f1" ]]; then
    if grep -q "legacy stub (no side effects)" "$f1"; then
      say "… already stubbed $f1"
    else
      write_file "$f1" EOF "// src/canon/guard/L1.js — legacy stub (no side effects)
export class CanonGuardL1 {}
export default CanonGuardL1;
" EOF
    fi
  else
    say "… skip (missing) $f1"
  fi
  if [[ -f "$f2" ]]; then
    if grep -q "legacy stub (no side effects)" "$f2"; then
      say "… already stubbed $f2"
    else
      write_file "$f2" EOF "// src/canon/guard/L2.js — legacy stub (no side effects)
import CanonGuardL1 from './L1.js';
export class CanonGuardL2 extends CanonGuardL1 {}
export default CanonGuardL2;
" EOF
    fi
  else
    say "… skip (missing) $f2"
  fi
}

disable_banner() {
  local f="src/canon/console/banner.js"
  [[ -f "$f" ]] || { say "… skip (missing) $f"; return 0; }
  if head -n1 "$f" | grep -q "LEGACY DISABLED"; then
    say "… already disabled $f"
    return 0
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    say "🔎 DRY: would prepend LEGACY DISABLED banner to $f"
  else
    do_backup "$f"
    tmp="$(mktemp)"
    { echo "// LEGACY DISABLED: moved to canon-console/browser/inject.js"; cat "$f"; } > "$tmp"
    mv "$tmp" "$f"
    say "✓ disabled $f"
  fi
}

say "== Neutralizing legacy src/canon =="
neutralize_hud
shim_init
alias_amplified
stub_console
stub_guard
disable_banner
say "✅ Done. Next: remove imports of src/canon/hud.js and src/canon/init*.js, and rely on canon-console/browser/inject.js (v3)."
