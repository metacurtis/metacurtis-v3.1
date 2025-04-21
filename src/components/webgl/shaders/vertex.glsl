precision mediump float;
// (noise.glsl is prepended by the loader)

uniform float uTime;
uniform float uSize;
uniform vec3  uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

attribute vec4 animFactors1;
attribute vec4 animFactors2;
varying   float vElevation;
varying   float vAlpha;

void main(){
  float t  = uTime * 0.1;
  vec3 pos = position
    + normalize(position)
    * snoise(vec3(position.xy * 0.3 + animFactors1.w, t + animFactors1.w))
    * animFactors2.x;

  float d = distance(pos.xy, uCursorPos.xy);
  if(d < uCursorRadius){
    float f = 1.0 - (d / uCursorRadius);
    pos += normalize(vec3(pos.xy - uCursorPos.xy,0.0)) * (f*f) * uRepulsionStrength;
  }

  vElevation = pos.z * 0.5 + 0.5;
  float xyD = length(pos.xy);
  vAlpha = (1.0 - min(xyD / 8.0, 1.0)) * 0.8 + 0.2;

  vec4 mv = modelViewMatrix * vec4(pos,1.0);
  gl_PointSize = uSize * (300.0 / -mv.z);
  gl_Position  = projectionMatrix * mv;
}
