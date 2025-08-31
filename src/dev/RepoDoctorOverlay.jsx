// src/dev/RepoDoctorOverlay.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Repo Doctor (JS/JSX version)
 * - Silent by default unless there are issues.
 * - Force show with ?doctor=1 or localStorage.REPO_DOCTOR="1".
 * - Checks:
 *   - Renderer mounted (material + uniforms)
 *   - Geometry attributes: atmosphericPosition (source) + text3DPosition (target) or alias
 *   - drawRange vs buffer count
 *   - uPointSize sanity
 *   - uActiveCount vs buffer count
 */

function isForced() {
  if (!import.meta.env.DEV) return false;
  try {
    const qp = new URLSearchParams(window.location.search);
    if (qp.get("doctor") === "1") return true;
    if (localStorage.getItem("REPO_DOCTOR") === "1") return true;
  } catch {}
  return false;
}

function runChecks() {
  const issues = [];

  const mat = typeof window !== "undefined" ? window.__consciousnessMaterial : null;
  const geo = typeof window !== "undefined" ? window.__particleGeometry : null;

  if (!mat) {
    issues.push("Renderer/material not found — is WebGLBackground mounted?");
  } else if (!mat.uniforms) {
    issues.push("Material has no uniforms object");
  } else {
    const u = mat.uniforms;
    ["uMorphProgress", "uPointSize"].forEach((k) => {
      if (!u || !u[k]) issues.push(`Missing uniform ${k}`);
    });
    const ps = u?.uPointSize?.value;
    if (typeof ps === "number" && ps < 8) {
      issues.push(`uPointSize is very small (${ps}) — letters may look faint`);
    }
  }

  if (!geo) {
    issues.push("Particle geometry not found — check geometryRef in WebGLBackground");
  } else {
    const getAttr = (name) => (geo.getAttribute ? geo.getAttribute(name) : null);
    const atmos = getAttr("atmosphericPosition");
    const text =
      getAttr("text3DPosition") ||
      getAttr("text3DPosition"); // back-compat alias while migrating

    if (!atmos) issues.push("Missing attribute atmosphericPosition (morph source)");
    if (!text)
      issues.push("Missing attribute text3DPosition (morph target) or text3DPosition (alias)");

    const pos = getAttr("position");
    const bufCount = pos?.count || 0;
    const drawCount =
      (geo.drawRange && typeof geo.drawRange.count === "number" && geo.drawRange.count) ||
      bufCount;

    if (bufCount && drawCount && drawCount < bufCount) {
      issues.push(`drawRange smaller than buffer: ${drawCount} < ${bufCount}`);
    }

    const active = mat?.uniforms?.uActiveCount?.value;
    if (typeof active === "number" && bufCount && active > bufCount) {
      issues.push(`uActiveCount (${active}) exceeds buffer count (${bufCount})`);
    }

    if (atmos?.array && text?.array && atmos.array.length !== text.array.length) {
      issues.push(
        `Source/target length mismatch: atmos=${atmos.array.length}, text=${text.array.length}`
      );
    }
  }

  return issues;
}

export default function RepoDoctorOverlay() {
  const [issues, setIssues] = useState([]);
  const [force, setForce] = useState(isForced());

  useEffect(() => {
    setIssues(runChecks());
    // Re-run once after a short delay to catch async mounts
    const t = setTimeout(() => setIssues(runChecks()), 800);
    return () => clearTimeout(t);
  }, [force]);

  // Only show if forced OR there are issues (and in DEV)
  const show = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return force || issues.length > 0;
  }, [force, issues]);

  if (!show) return null;

  return (
    <div style={panel}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Repo Doctor</div>

      {issues.length === 0 ? (
        <div>✅ No issues detected</div>
      ) : (
        issues.map((m, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            ⚠️ {m}
          </div>
        ))
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => setIssues(runChecks())}>Re-run checks</button>
        <button onClick={() => setForce(false)}>Hide (until refresh)</button>
        <button
          onClick={() => {
            localStorage.setItem("REPO_DOCTOR", "1");
            setForce(true);
          }}
        >
          Always show (DEV)
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("REPO_DOCTOR");
            setForce(false);
          }}
        >
          Only with ?doctor=1
        </button>
      </div>
    </div>
  );
}

const panel = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 9999,
  color: "#fff",
  background: "rgba(20,20,24,.85)",
  padding: "10px 12px",
  borderRadius: 10,
  font: "12px/16px ui-monospace, SFMono-Regular, Menlo, monospace",
  border: "1px solid rgba(255,255,255,.08)",
  backdropFilter: "blur(8px)",
};
