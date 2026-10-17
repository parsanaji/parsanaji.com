in float vAlpha;
in float vNear;

out vec4 fragColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  // = smoothstep(0.5, 0.35, d) from spec 3.2, written with ascending edges (reversed edges are undefined in GLSL)
  float a = (1.0 - smoothstep(0.35, 0.5, d)) * vAlpha;
  if (a <= 0.002) discard;
  vec3 col = mix(vec3(0.961), vec3(1.0), vNear); // #f5f5f5, brighter near the pointer
  fragColor = vec4(col, a);
}
