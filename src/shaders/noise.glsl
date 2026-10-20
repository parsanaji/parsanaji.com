const float OFFSET = 256.0;

// Blueprint hash (part-c.html) with z masked to 8 bits so the noise is periodic in z (period 256).
float hash3(uvec3 c) {
  uint h = (c.x * 374761393u) ^ (c.y * 668265263u) ^ ((c.z & 255u) * 1013904223u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h) * (1.0 / 4294967296.0);
}

// Blueprint noise3: trilinear value noise with a smoothstep fade. p.xy >= 0 (OFFSET), p.z in [0, 256).
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  uvec3 c = uvec3(i);
  float c000 = hash3(c);
  float c100 = hash3(c + uvec3(1u, 0u, 0u));
  float c010 = hash3(c + uvec3(0u, 1u, 0u));
  float c110 = hash3(c + uvec3(1u, 1u, 0u));
  float c001 = hash3(c + uvec3(0u, 0u, 1u));
  float c101 = hash3(c + uvec3(1u, 0u, 1u));
  float c011 = hash3(c + uvec3(0u, 1u, 1u));
  float c111 = hash3(c + uvec3(1u, 1u, 1u));
  return mix(mix(mix(c000, c100, f.x), mix(c010, c110, f.x), f.y),
             mix(mix(c001, c101, f.x), mix(c011, c111, f.x), f.y), f.z);
}

// Blueprint fbm: two octaves; z.x = z, z.y = the Blueprint's z * 1.4 + 3.1, both wrapped to [0, 256) on the CPU.
float fbm(vec2 p, vec2 z) {
  return 0.62 * noise3(vec3(p, z.x)) + 0.38 * noise3(vec3(p * 2.1 + vec2(7.3, 1.7), z.y));
}
