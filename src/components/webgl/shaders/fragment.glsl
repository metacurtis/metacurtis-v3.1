precision mediump float;

uniform float uScrollProgress;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorC;
uniform float uColorIntensity;

varying float vElevation;
varying float vAlpha;

void main(){
  float m = smoothstep(0.0,1.0, mix(vElevation, uScrollProgress, 0.7));
  vec3 col = m < 0.5
    ? mix(uColorA, uColorB, m * 2.0)
    : mix(uColorB, uColorC, (m - 0.5) * 2.0);
  col *= uColorIntensity;

  float dist = length(gl_PointCoord - vec2(0.5));
  float a    = 1.0 - smoothstep(0.45, 0.5, dist);
  if(a < 0.01) discard;

  gl_FragColor = vec4(col, a * vAlpha);
}
