// Pass 2 vertex shader (12.14): one instance per lattice cell, four vertices per stroke quad (TRIANGLE_STRIP).
// Blueprint part-c.html draw(), glyph 'dashes': the lattice point drifts on slow noise and slides away from the
// pointer, the angle comes from slower noise, half-length sp (0.15 + 0.5 v), width max(1, 0.08 sp) CSS px,
// alpha 0.16 + 0.84 v, colour by tier (or field-1 only in the muted mode).
uniform sampler2D uSurf;    // pass-1 output, one texel per cell, .r = v
uniform int   uCols;        // lattice columns
uniform vec2  uView;        // field size, CSS px
uniform float uCell;        // lattice spacing sp, CSS px
uniform float uDpr;         // device px per CSS px (anti-alias margin)
uniform vec3  uZd;          // flowZ[6..8]: drift noise z (x, y), angle noise z
uniform vec4  uPointer;     // xy = eased pointer (CSS px, field space), z = radius R (CSS px), w = strength 0..1
uniform float uE;           // mask progress 0..1: the drift fades out as the text forms
uniform vec4  uDash;        // x = lenMin (0.15), y = lenK (0.5), z = widthK (0.08), w = flowAmp (0.9)
uniform vec4  uDash2;       // x = intensity I, y = repelK (2.6), z = flowScalePx (171.43), w = angleScalePx (200)
uniform vec3  uField1;      // stroke colour, v <= uTiers.x (and every stroke in the muted colour mode)
uniform vec3  uField2;      // uTiers.x < v <= uTiers.y
uniform vec3  uField3;      // v > uTiers.y
uniform vec2  uTiers;       // 0.68, 0.85
uniform vec2  uAlpha;       // x = alphaMin (0.16), y = colour mode (0 = core tiers, 1 = muted)

out vec2 vLocal;            // CSS px along (x) and across (y) the stroke, from its centre
out vec3 vShape;            // x = half-length, y = half-width, z = anti-alias half-width (CSS px)
out vec4 vColor;            // straight-alpha stroke colour

/* noise.glsl inserted here */

void main() {
  int id = gl_InstanceID;
  int row = id / uCols;
  ivec2 cell = ivec2(id - row * uCols, row);
  float v = texelFetch(uSurf, cell, 0).r;
  vec2 h = (vec2(cell) + 0.5) * uCell;                      // lattice point, CSS px, y down
  float I = uDash2.x;

  // flow drift (Blueprint tx, ty): less as the text forms
  vec2 q = h / uDash2.z + OFFSET;
  float amp = uCell * uDash.w * I * (1.0 - uE);
  vec2 c = h + (vec2(noise3(vec3(q + vec2(11.0, 0.0), uZd.x)), noise3(vec3(q + vec2(0.0, 37.0), uZd.y))) - 0.5) * amp;

  // pointer repel (Blueprint reaction 'repel'): strokes inside R slide away from the pointer
  vec2 dp = h - uPointer.xy;
  float d = length(dp);
  if (uPointer.w > 0.0 && d < uPointer.z) {
    float f = 1.0 - d / uPointer.z;
    f = f * f * (3.0 - 2.0 * f) * uPointer.w;
    c += (dp / max(d, 1e-3)) * (f * uCell * uDash2.y);
  }

  float ang = noise3(vec3(h / uDash2.w + OFFSET, uZd.z)) * 6.2831853;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  float halfLen = uCell * (uDash.x + uDash.y * v);
  float halfW = max(1.0, uCell * uDash.z) * 0.5;
  float aa = 0.7 / uDpr;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;   // (-1,-1) (1,-1) (-1,1) (1,1)
  vec2 local = corner * vec2(halfLen + halfW + aa, halfW + aa);
  vec2 p = c + dir * local.x + nrm * local.y;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);

  vLocal = local;
  vShape = vec3(halfLen, halfW, aa);
  vec3 ink = uAlpha.y > 0.5 ? uField1 : (v > uTiers.y ? uField3 : (v > uTiers.x ? uField2 : uField1));
  vColor = vec4(ink, uAlpha.x + (1.0 - uAlpha.x) * v);
}
