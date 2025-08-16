/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-ui-or-adapter-from-engine",
      comment: "Engine cannot import ui/* or adapter/*",
      severity: "error",
      from: { path: "^src/engine" },
      to:   { path: "^src/(ui|adapter)" }
    },
    {
      name: "no-engine-internals-from-others",
      comment: "Only ports/ or config/ may be used by non-engine code.",
      severity: "error",
      from: { path: "^src/(ui|adapter|components|hooks|utils|theater|config/sst3|config/canonical)" },
      to:   { path: "^src/engine" }
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    combinedDependencies: true
  }
};
