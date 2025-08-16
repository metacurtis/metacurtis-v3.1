/** Minimal ESLint config focused on arch boundaries */
module.exports = {
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["src/engine/*"], "message": "Engine is a leaf; use ports/ or config/ as interfaces." }
      ]
    }]
  }
}
