in vec2 aAlt;
in float aSeed;
in float aSize;
in float aAlpha;

uniform float uTime;         // ms, vibration clock
uniform int   uPhase;        // 0 ENTRY 1 IDLE 2 SCRAMBLE_OUT 3 FORM_ALT 4 HOLD_ALT 5 SCRAMBLE_BACK 6 FORM_NAME
uniform float uT;            // ms elapsed in the current phase
uniform float uDur;          // ms base duration of the current phase
uniform float uStagger;      // ms of per-dot stagger in the current phase
uniform vec2  uScatter;      // morph scatter radius min/max (px)
uniform vec2  uEntryScatter; // entry scatter radius min/max (px)
uniform float uHalfWidth;    // viewport half width (px)
uniform float uDpr;
uniform float uDotSize;      // CSS px
uniform float uNearScale;
uniform float uAlphaScale;
uniform float uVibAmp;       // px
uniform float uVibFreq;      // Hz
uniform float uVibScale;     // 1/px
uniform float uBreath;       // scale about the origin
uniform vec4  uPointer[8];   // x, y, strength, velocity factor
uniform float uRepelRadius;  // px
uniform float uRepelStrength;
uniform float uRepelClamp;   // fraction of the radius
uniform vec4  uRipple;       // ox, oy, radius, amplitude (0 = off)
uniform float uRippleBand;   // px
uniform float uReduced;      // 1 under prefers-reduced-motion

out float vAlpha;
out float vNear;

float easeOutExpo(float t) { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
float easeInCubic(float t) { return t * t * t; }

vec2 scatterDir(vec2 p, float seed) {
  float a = snoise(vec3(p * 0.004, seed * 7.0)) * 6.2831853;
  return vec2(cos(a), sin(a));
}

void main() {
  vec2 home = position.xy;
  vec2 alt = aAlt;
  vec2 dir = scatterDir(home, aSeed);
  float r = mix(uScatter.x, uScatter.y, fract(aSeed * 13.37));
  float rEntry = mix(uEntryScatter.x, uEntryScatter.y, fract(aSeed * 7.77));
  float alpha = aAlpha * uAlphaScale;
  bool reduced = uReduced > 0.5;

  float delayFac = aSeed;
  if (uPhase == 0) delayFac = mix(aSeed, abs(home.x) / max(uHalfWidth, 1.0), 0.6);
  float local = clamp((uT - delayFac * uStagger) / max(uDur, 1.0), 0.0, 1.0);

  vec2 pos = home;
  if (uPhase == 0) {
    pos = reduced ? home : mix(home + dir * rEntry, home, easeOutExpo(local));
  } else if (uPhase == 2) {
    if (reduced) { pos = home; alpha *= 1.0 - local; }
    else pos = mix(home, home + dir * r, easeInCubic(local));
  } else if (uPhase == 3) {
    if (reduced) { pos = alt; alpha *= local; }
    else pos = mix(home + dir * r, alt, easeOutExpo(local));
  } else if (uPhase == 4) {
    pos = alt;
  } else if (uPhase == 5) {
    if (reduced) { pos = alt; alpha *= 1.0 - local; }
    else pos = mix(alt, alt + dir * r, easeInCubic(local));
  } else if (uPhase == 6) {
    if (reduced) { pos = home; alpha *= local; }
    else pos = mix(alt + dir * r, home, easeOutExpo(local));
  }

  // idle life: noise vibration (never per-frame randomness) and breath
  float tt = uTime * 0.001 * uVibFreq;
  vec2 vib = vec2(
    snoise(vec3(home * uVibScale, aSeed * 10.0 + tt)),
    snoise(vec3(home * uVibScale + 31.7, aSeed * 10.0 + 17.0 + tt))
  ) * uVibAmp;
  pos = (pos + vib) * uBreath;

  // ripple: a radial band travelling outward from its origin
  if (uRipple.w > 0.0) {
    vec2 dv = pos - uRipple.xy;
    float d = length(dv);
    float k = (d - uRipple.z) / uRippleBand; // pow() with a negative base is undefined in GLSL
    float band = exp(-k * k);
    pos += (dv / max(d, 0.001)) * band * uRipple.w;
  }

  // pointer repel: the live pointer plus a decaying trail, stateless
  vec2 push = vec2(0.0);
  float near = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 P = uPointer[i];
    if (P.z <= 0.0) continue;
    vec2 dv = pos - P.xy;
    float d = length(dv);
    if (d >= uRepelRadius) continue;
    float f = 1.0 - smoothstep(0.0, 1.0, d / uRepelRadius); // GLSL leaves smoothstep undefined when edge0 >= edge1
    f *= f;
    push += (dv / max(d, 0.001)) * (uRepelRadius * uRepelStrength * f * P.z * (1.0 + P.w));
    near = max(near, f * P.z);
  }
  float pl = length(push);
  float maxPush = uRepelRadius * uRepelClamp;
  if (pl > maxPush) push *= maxPush / pl;
  pos += push;

  vNear = near;
  vAlpha = mix(alpha, 1.0, near);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
  gl_PointSize = uDotSize * uDpr * aSize * mix(1.0, uNearScale, near);
}
