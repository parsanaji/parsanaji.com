// Pass 2 fragment shader (12.14): an anti-aliased capsule (round-capped stroke), premultiplied over the field-0 clear.
in vec2 vLocal;
in vec3 vShape;
in vec4 vColor;

out vec4 outColor;

void main() {
  vec2 q = vec2(max(abs(vLocal.x) - vShape.x, 0.0), vLocal.y);
  float d = length(q) - vShape.y;                            // signed distance to the stroke edge, CSS px
  float cov = clamp(0.5 - d / (2.0 * vShape.z), 0.0, 1.0);   // one anti-alias width across the edge
  float a = vColor.a * cov;
  outColor = vec4(vColor.rgb * a, a);
}
