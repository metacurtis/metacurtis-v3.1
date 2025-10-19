module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='setDrawRange']",
        message: 'Only WebGLBackground may call geometry.setDrawRange()',
      },
      {
        selector: "MemberExpression[object.name='material'][property.name='uniforms']",
        message: 'Only WebGLBackground may mutate material.uniforms',
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        name: 'three',
        importNames: ['BufferGeometry'],
        message: 'Only WebGLBackground may import BufferGeometry',
      },
    ],
  },
  overrides: [
    {
      files: ['src/components/webgl/WebGLBackground.jsx'],
      rules: { 'no-restricted-syntax': 'off', 'no-restricted-imports': 'off' },
    },
  ],
};
