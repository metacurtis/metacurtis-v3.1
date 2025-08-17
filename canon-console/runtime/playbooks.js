// canon-console/runtime/playbooks.js
export const Playbooks = {
  GL_VALIDATE_FAIL_BASELINE: {
    id:'GL_VALIDATE_FAIL_BASELINE',
    plan:[
      {step:'compile_variant',args:{defines:{BASELINE_VARIANT:1},target:'shadow'}},
      {step:'assert',args:{shaderCompileOk:true,linkOk:true,validateOk:true}},
      {step:'hotswap_material',args:{}},
      {step:'set_draw_range_from_uniforms',args:{}},
      {step:'verify_metrics',args:{fpsMin:55,glErrors:0,probeMs:240}}
    ]
  }
};