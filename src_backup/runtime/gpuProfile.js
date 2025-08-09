export function detectGPUProfile(gl) {
  const info = { vendor: "unknown", renderer: "unknown", webgl2: !!gl?.texStorage2D };
  try {
    const ext = gl.getExtension?.("WEBGL_debug_renderer_info");
    if (ext) {
      info.vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || info.vendor;
      info.renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || info.renderer;
    }
  } catch {}

  const vendor = info.vendor.toLowerCase() + " " + info.renderer.toLowerCase();
  const isIntel = /intel/.test(vendor);
  const isApple = /apple/.test(vendor) || /metal/.test(vendor);
  const isNvidia = /nvidia|geforce/.test(vendor);
  const isAMD = /amd|radeon/.test(vendor);
  const isIntegrated = isIntel || /uhd|iris|hd graphics/.test(vendor);
  const isMobile = /mali|adreno|powervr|apple/.test(vendor);

  let pointMax = 48;
  try {
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    if (range && range.length) pointMax = Math.floor(Math.min(64, range[1] * 0.85));
  } catch {}

  return {
    ...info,
    isIntel, isApple, isNvidia, isAMD, isIntegrated, isMobile,
    maxPointSize: pointMax
  };
}
