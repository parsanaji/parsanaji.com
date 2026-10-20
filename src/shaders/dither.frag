uniform sampler2D uSurf;    // pass-1 output, one texel per cell, .r = v
uniform float uCellDev;     // device px per cell (an integer value)
uniform float uCanvasH;     // drawing-buffer height, device px
uniform vec3  uField0;      // field-0 (off)
uniform vec3  uField1;      // field-1 (on, v <= uTiers.x)
uniform vec3  uField2;      // field-2 (on, uTiers.x < v <= uTiers.y)
uniform vec3  uField3;      // field-3 (on, v > uTiers.y)
uniform vec2  uTiers;       // 0.66, 0.9

out vec4 outColor;

const int BAYER8[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21);

void main() {
  ivec2 cell = ivec2(int(gl_FragCoord.x / uCellDev), int((uCanvasH - gl_FragCoord.y) / uCellDev));
  float v = texelFetch(uSurf, cell, 0).r;
  float th = (float(BAYER8[(cell.x & 7) | ((cell.y & 7) << 3)]) + 0.5) / 64.0;
  vec3 c = uField0;
  if (v > th) c = v > uTiers.y ? uField3 : (v > uTiers.x ? uField2 : uField1);
  outColor = vec4(c, 1.0);
}
