import * as THREE from 'three';
import fragGlsl from '../shaders/field.frag?raw';
import vertGlsl from '../shaders/field.vert?raw';
import noiseGlsl from '../shaders/noise.glsl?raw';
import type { Params, PhaseId, PointerSlot, RippleState } from './types';

const SLOT_COUNT = 8;

/** One Three.js Points object; every motion rule runs in the vertex shader. */
export class ParticleField {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  private readonly material: THREE.ShaderMaterial;
  private readonly points: THREE.Points;
  private geometry = new THREE.BufferGeometry();
  private count = 0;

  constructor(canvas: HTMLCanvasElement, params: Params, dpr: number) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `${noiseGlsl}\n${vertGlsl}`,
      fragmentShader: fragGlsl,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: params.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uT: { value: 0 },
        uDur: { value: 1 },
        uStagger: { value: 0 },
        uScatter: { value: new THREE.Vector2(params.scatterMin, params.scatterMax) },
        uEntryScatter: { value: new THREE.Vector2(params.entryScatterMin, params.entryScatterMax) },
        uHalfWidth: { value: 1 },
        uDpr: { value: dpr },
        uDotSize: { value: params.dotSize },
        uNearScale: { value: params.nearScale },
        uAlphaScale: { value: params.alphaScale },
        uVibAmp: { value: params.vibAmp },
        uVibFreq: { value: params.vibFreq },
        uVibScale: { value: params.vibScale },
        uBreath: { value: 1 },
        uPointer: { value: Array.from({ length: SLOT_COUNT }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uRepelRadius: { value: params.repelRadius },
        uRepelStrength: { value: params.repelStrength },
        uRepelClamp: { value: params.repelClampFrac },
        uRipple: { value: new THREE.Vector4(0, 0, 0, 0) },
        uRippleBand: { value: params.ripple.bandPx },
        uReduced: { value: 0 },
      },
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  get size(): number {
    return this.count;
  }

  /** 1 world unit = 1 CSS px, origin at the centre, y up (spec 3.4). */
  setViewport(w: number, h: number): void {
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.material.uniforms.uHalfWidth.value = w / 2;
  }

  setDpr(dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.material.uniforms.uDpr.value = dpr;
  }

  /** Upload a home/alt pair (interleaved x, y, equal lengths). Rebuilds the geometry. */
  setTargets(
    home: Float32Array,
    alt: Float32Array,
    rand: () => number,
    p: Pick<Params, 'sizeVarMin' | 'sizeVarMax' | 'alphaMin' | 'alphaMax'>,
  ): void {
    if (alt.length !== home.length) throw new Error(`target length mismatch: home ${home.length} alt ${alt.length}`);
    const n = home.length / 2;
    const position = new Float32Array(n * 3);
    const aAlt = new Float32Array(n * 2);
    const aSeed = new Float32Array(n);
    const aSize = new Float32Array(n);
    const aAlpha = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      position[i * 3] = home[i * 2];
      position[i * 3 + 1] = home[i * 2 + 1];
      position[i * 3 + 2] = 0;
      aAlt[i * 2] = alt[i * 2];
      aAlt[i * 2 + 1] = alt[i * 2 + 1];
      aSeed[i] = rand();
      aSize[i] = p.sizeVarMin + (p.sizeVarMax - p.sizeVarMin) * rand();
      aAlpha[i] = p.alphaMin + (p.alphaMax - p.alphaMin) * rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aAlt', new THREE.BufferAttribute(aAlt, 2));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1));
    this.points.geometry = geometry;
    this.geometry.dispose();
    this.geometry = geometry;
    this.count = n;
  }

  setMorph(phase: PhaseId, tMs: number, durMs: number, staggerMs: number): void {
    const u = this.material.uniforms;
    u.uPhase.value = phase;
    u.uT.value = tMs;
    u.uDur.value = Math.max(1, durMs);
    u.uStagger.value = staggerMs;
  }

  setTime(ms: number): void {
    this.material.uniforms.uTime.value = ms;
  }

  setBreath(scale: number): void {
    this.material.uniforms.uBreath.value = scale;
  }

  setReduced(reduced: boolean): void {
    this.material.uniforms.uReduced.value = reduced ? 1 : 0;
  }

  setRepelRadius(px: number): void {
    this.material.uniforms.uRepelRadius.value = px;
  }

  setRipple(state: RippleState): void {
    (this.material.uniforms.uRipple.value as THREE.Vector4).set(state.ox, state.oy, state.radius, state.active ? state.amplitude : 0);
    this.material.uniforms.uRippleBand.value = Math.max(1, state.band);
  }

  setPointer(slots: PointerSlot[]): void {
    const arr = this.material.uniforms.uPointer.value as THREE.Vector4[];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = slots[i];
      if (s) arr[i].set(s.x, s.y, s.strength, s.vel);
      else arr[i].set(0, 0, 0, 0);
    }
  }

  /** Push every tunable except counts/targets (those go through setTargets). */
  applyParams(p: Params): void {
    const u = this.material.uniforms;
    u.uDotSize.value = p.dotSize;
    u.uNearScale.value = p.nearScale;
    u.uAlphaScale.value = p.alphaScale;
    u.uVibAmp.value = p.vibAmp;
    u.uVibFreq.value = p.vibFreq;
    u.uVibScale.value = p.vibScale;
    (u.uScatter.value as THREE.Vector2).set(p.scatterMin, p.scatterMax);
    (u.uEntryScatter.value as THREE.Vector2).set(p.entryScatterMin, p.entryScatterMax);
    u.uRepelRadius.value = p.repelRadius;
    u.uRepelStrength.value = p.repelStrength;
    u.uRepelClamp.value = p.repelClampFrac;
    u.uRippleBand.value = p.ripple.bandPx;
    const blending = p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (this.material.blending !== blending) {
      this.material.blending = blending;
      this.material.needsUpdate = true;
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
