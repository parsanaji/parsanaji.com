uniform float uCell;        // CSS px per cell
uniform vec4  uZ;           // flowZ[0..3]: warp-x fbm (z, z2), warp-y fbm (z, z2)
uniform vec2  uZm;          // flowZ[4..5]: main fbm (z, z2)
uniform vec2  uCenter;      // field centre, CSS px (breath origin)
uniform float uBreath;      // domain scale, 1 +- breath amplitude
uniform vec4  uPointer;     // xy = eased pointer (CSS px, field space), z = radius R (CSS px), w = strength 0..1
uniform vec2  uWarp;        // x = warp factor (0.55), y = brightness boost (0.12)
uniform vec4  uRipples[8];  // xy = origin (CSS px), z = ring radius (CSS px), w = amplitude (0 = slot unused)
uniform vec2  uRipple;      // x = ring sigma (CSS px), y = gain (0.9)
uniform sampler2D uMask;    // R8 coverage of the name / egg text, LINEAR, CLAMP_TO_EDGE
uniform vec2  uMaskSize;    // CSS px covered by the mask texture
uniform float uE;           // mask progress 0..1 (0 = field only)
uniform vec4  uMaskMix;     // x = hold dim (0.3), y = ink floor (0.91), z = dissolve edge (0.08), w = melt px (48)
uniform vec3  uShape;       // x = warp scale px (240), y = main scale px (160), z = warp amplitude (2.6)
uniform vec2  uLevel;       // x = level (0.3), y = gain (2.1)

out vec4 outColor;

/* noise.glsl inserted here */

// Blueprint vAt(), raster + dither branch, at CSS-px sample s. warp returns (wx, wy) - 0.5 for the mask melt.
float surface(vec2 s, out vec2 warp) {
  vec2 a = s / uShape.x + OFFSET;
  float wx = fbm(a + vec2(3.1, 0.0), uZ.xy);
  float wy = fbm(a + vec2(0.0, 7.7), uZ.zw);
  warp = vec2(wx, wy) - 0.5;
  float v = fbm(s / uShape.y + OFFSET + warp * uShape.z, uZm);
  v = clamp((v - uLevel.x) * uLevel.y, 0.0, 1.0);
  return min(1.0, v * 0.7 + 0.4 * (1.0 - abs(1.0 - 2.0 * v)) * v);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);                 // texel (i, j); row j = 0 is the top row of the field
  vec2 x = (vec2(cell) + 0.5) * uCell;                 // cell centre, CSS px, y down

  // pointer repel (Blueprint drawRaster): the sample point moves toward the pointer, so the surface spreads away
  vec2 xw = x;
  float f = 0.0;
  vec2 dp = x - uPointer.xy;
  float d = length(dp);
  if (uPointer.w > 0.0 && d < uPointer.z) {
    f = 1.0 - d / uPointer.z;
    f = f * f * (3.0 - 2.0 * f) * uPointer.w;
    xw = x - (dp / max(d, 1e-3)) * (f * uPointer.z * uWarp.x);
  }
  vec2 s = uCenter + (xw - uCenter) / uBreath;          // breath: slow domain zoom about the centre

  vec2 warp;
  float F = surface(s, warp);
  float v = F;

  if (uE > 0.0) {
    // dissolve: each cell flips between field and text at its own static noise threshold
    float theta = 0.6 * noise3(vec3(vec2(cell) * 0.08 + OFFSET, 17.0)) + 0.4 * hash3(uvec3(uvec2(cell), 91u));
    float w = uMaskMix.z;
    float k = smoothstep(theta - w, theta + w, uE * (1.0 + 2.0 * w) - w);
    float g = 1.0 - uE;
    float m = texture(uMask, (s + warp * (2.0 * uMaskMix.w * g * g)) / uMaskSize).r;
    float n = mix(uMaskMix.x * F, uMaskMix.y + (1.0 - uMaskMix.y) * F, m);
    v = mix(F, n, k);
  }

  v += f * uWarp.y;                                    // pointer brightness boost
  for (int r = 0; r < 8; r++) {                        // Shockwave rings
    vec4 R = uRipples[r];
    if (R.w <= 0.0) continue;
    float e = length(xw - R.xy) - R.z;
    v += exp(-(e * e) / (2.0 * uRipple.x * uRipple.x)) * R.w * uRipple.y;
  }
  outColor = vec4(min(v, 1.0), 0.0, 0.0, 1.0);
}
