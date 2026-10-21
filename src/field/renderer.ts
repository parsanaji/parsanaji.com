import { createContext } from '../gl/context';
import { startProgram, type PendingProgram, type ProgramHandle } from '../gl/program';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget, type SurfaceTarget } from '../gl/targets';
import dashFrag from '../shaders/dash.frag?raw';
import dashVert from '../shaders/dash.vert?raw';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import noiseGlsl from '../shaders/noise.glsl?raw';
import surfaceFrag from '../shaders/surface.frag?raw';
import type { FieldColors, RGB } from '../theme/theme';
import { INTENSITY_K } from './flow';
import type { MaskPlane } from './nameMask';
import type { FieldParams } from './params';
import type { Grid } from './sizing';

export type { FieldColors } from '../theme/theme'; // P1

/** Pass-1 uniforms in declaration order (Appendix A §3.5, spec 10.2). */
export const UNIFORMS_PASS1: readonly string[] = Object.freeze([
  'uCell', 'uZ', 'uZm', 'uCenter', 'uBreath', 'uPointer', 'uWarp', 'uRipples', 'uRipple', 'uMask', 'uMaskSize', 'uE', 'uMaskMix', 'uShape', 'uLevel',
]);
/** Pass-2 uniforms in declaration order (dash.vert; 12.14). The dash fragment shader declares none. */
export const UNIFORMS_PASS2: readonly string[] = Object.freeze([
  'uSurf', 'uCols', 'uView', 'uCell', 'uDpr', 'uZd', 'uPointer', 'uE', 'uDash', 'uDash2', 'uField1', 'uField2', 'uField3', 'uTiers', 'uAlpha', 'uInk', 'uWeight',
]);

/** Everything one frame uploads (spec 4.4.3 step 4). Field-space CSS px; `z` is flowZ's 9 values; `ripples` is 8 × vec4. */
export interface FrameInputs {
  z: Float32Array; breath: number; center: [number, number];
  pointer: { x: number; y: number; radius: number; strength: number };
  ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
}

const NOISE_MARKER = '/* noise.glsl inserted here */';
/** Spec 4.5.3: the uniform block, then noise.glsl, then the body; startProgram prepends the GLSL header. */
const PASS1_SOURCE = surfaceFrag.replace(NOISE_MARKER, noiseGlsl);
const PASS2_VERT = dashVert.replace(NOISE_MARKER, noiseGlsl);
const EMPTY_MASK = new Uint8Array(1);

type Uniforms = Readonly<Record<string, WebGLUniformLocation>>;

/**
 * Owns every GL object of the field and draws it in two passes (spec 4.5 as amended by 12.14): pass 1 evaluates one
 * texel per lattice cell into the surface target, pass 2 clears the canvas to field-0 and draws one anti-aliased
 * stroke per cell with a single instanced draw. Exactly two draw calls per render.
 */
export class FieldRenderer {
  private readonly canvas: HTMLCanvasElement;
  private glc: WebGL2RenderingContext | null;
  private params: FieldParams;
  private parallel: KHR_parallel_shader_compile | null = null;
  private pending: [PendingProgram, PendingProgram] | null = null;
  private p1: ProgramHandle | null = null;
  private p2: ProgramHandle | null = null;
  private tri: { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } | null = null;
  private quad: WebGLVertexArrayObject | null = null; // no attributes: dash.vert builds the quad from gl_VertexID
  private target: SurfaceTarget | null = null;
  private mask: WebGLTexture | null = null;
  private emptyMask: WebGLTexture | null = null;
  private maskPlane: MaskPlane | null = null;
  private maskSize: [number, number] = [1, 1];
  private gridValue: Grid | null = null;
  private gridDirty = true;
  private paramsDirty = true;
  private isReady = false;
  private isFailed = false;

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, params: FieldParams) {
    this.canvas = canvas;
    this.glc = gl;
    this.params = params;
    this.build(gl);
  }

  /** Context, geometry, empty mask and both programs started (async when the extension exists). Null on any failure. */
  static create(canvas: HTMLCanvasElement, params: FieldParams): FieldRenderer | null {
    try {
      const gl = createContext(canvas);
      return gl ? new FieldRenderer(canvas, gl, params) : null;
    } catch {
      return null;
    }
  }

  /**
   * Polls both programs and finishes them once (call it inside an animation frame: without
   * KHR_parallel_shader_compile, finish() blocks on the link). A ShaderError sets `failed`.
   */
  get ready(): boolean {
    if (this.isReady) return true;
    const gl = this.glc;
    if (this.isFailed || !gl || !this.pending || gl.isContextLost()) return false;
    const [a, b] = this.pending;
    if (!a.ready() || !b.ready()) return false;
    try {
      this.p1 = a.finish();
      this.p2 = b.finish();
    } catch {
      this.isFailed = true;
      return false;
    }
    this.pending = null;
    gl.useProgram(this.p1.program);
    gl.uniform1i(this.u1().uMask ?? null, 1); // pass 1 samples unit 1 only
    gl.useProgram(this.p2.program);
    gl.uniform1i(this.u2().uSurf ?? null, 0); // pass 2 samples unit 0 only
    this.gridDirty = true;
    this.paramsDirty = true;
    this.isReady = true;
    return true;
  }

  get failed(): boolean {
    return this.isFailed;
  }

  get lost(): boolean {
    return this.glc !== null && this.glc.isContextLost();
  }

  /** P4: the context for debug hooks; null after dispose(). */
  get gl(): WebGL2RenderingContext | null {
    return this.glc;
  }

  /** Spec 3.7.8: paints the drawing buffer one colour (field-0) before the first real frame. */
  clear(c: RGB): void {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(c[0], c[1], c[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Spec 3.7.1: backing store = the device box; the surface target is recreated only when cols or rows change. */
  resize(grid: Grid): void {
    const gl = this.glc;
    if (!gl) return;
    if (this.canvas.width !== grid.widthDev) this.canvas.width = grid.widthDev;
    if (this.canvas.height !== grid.heightDev) this.canvas.height = grid.heightDev;
    this.gridValue = grid;
    this.gridDirty = true;
    if (gl.isContextLost() || (this.target && this.target.cols === grid.cols && this.target.rows === grid.rows)) return;
    if (this.target) deleteSurfaceTarget(gl, this.target);
    this.target = null;
    try {
      this.target = createSurfaceTarget(gl, grid.cols, grid.rows);
    } catch {
      this.isFailed = true; // 4.5.2: an incomplete FBO is the fallback
    }
  }

  /** Uploads (or with null deletes) the mask; its CSS extent is fixed to the grid it was rasterised for (3.7.1). */
  setMask(plane: MaskPlane | null): void {
    const gl = this.glc;
    this.maskPlane = plane;
    if (!gl) return;
    if (this.mask) gl.deleteTexture(this.mask);
    this.mask = null;
    if (!plane) return;
    const g = this.gridValue;
    const ss = this.params.mask.supersample;
    this.maskSize = g ? [(plane.width * g.cellCss) / ss, (plane.height * g.cellCss) / ss] : [plane.width, plane.height];
    if (gl.isContextLost()) return;
    this.mask = createMaskTexture(gl, plane.width, plane.height, plane.data);
  }

  /** Spec 4.5.5 "on change" uniforms: uWarp, uRipple.y, uMaskMix, uShape, uLevel, uDash, uDash2, uTiers, uAlpha. */
  setParams(p: FieldParams): void {
    this.params = p;
    this.paramsDirty = true;
  }

  /** One frame: pass 1 into the surface target, pass 2 to the canvas. A no-op until ready, or while lost. */
  render(f: FrameInputs): void {
    const gl = this.glc;
    if (!gl || !this.ready || gl.isContextLost() || !this.target || !this.gridValue || !this.tri || !this.quad || !this.p1 || !this.p2) return;
    const g = this.gridValue;
    const u1 = this.u1();
    const u2 = this.u2();

    // pass 1: one texel per cell (Appendix A §3.5)
    gl.bindVertexArray(this.tri.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target.fbo);
    gl.viewport(0, 0, this.target.cols, this.target.rows);
    gl.useProgram(this.p1.program);
    if (this.gridDirty) {
      gl.uniform1f(u1.uCell ?? null, g.cellCss);
      gl.useProgram(this.p2.program);
      gl.uniform1i(u2.uCols ?? null, g.cols);
      gl.uniform2f(u2.uView ?? null, g.cssW, g.cssH);
      gl.uniform1f(u2.uCell ?? null, g.cellCss);
      gl.uniform1f(u2.uDpr ?? null, g.dpr);
      gl.useProgram(this.p1.program);
      this.gridDirty = false;
    }
    if (this.paramsDirty) {
      this.writeParams(gl, u1, u2);
      this.paramsDirty = false;
    }
    gl.uniform4f(u1.uZ ?? null, f.z[0], f.z[1], f.z[2], f.z[3]);
    gl.uniform2f(u1.uZm ?? null, f.z[4], f.z[5]);
    gl.uniform2f(u1.uCenter ?? null, f.center[0], f.center[1]);
    gl.uniform1f(u1.uBreath ?? null, f.breath);
    gl.uniform4f(u1.uPointer ?? null, f.pointer.x, f.pointer.y, f.pointer.radius, f.pointer.strength);
    gl.uniform4fv(u1.uRipples ?? null, f.ripples);
    gl.uniform2f(u1.uRipple ?? null, f.rippleSigma, this.params.ripple.gain);
    gl.uniform2f(u1.uMaskSize ?? null, this.maskSize[0], this.maskSize[1]);
    const e = this.mask ? f.maskE : 0;
    gl.uniform1f(u1.uE ?? null, e);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.mask ?? this.emptyMask);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // pass 2: field-0 clear, then one instanced stroke per cell, premultiplied over it (12.14)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, g.widthDev, g.heightDev);
    gl.clearColor(f.colors.f0[0], f.colors.f0[1], f.colors.f0[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.p2.program);
    gl.uniform3f(u2.uZd ?? null, f.z[6], f.z[7], f.z[8]);
    gl.uniform4f(u2.uPointer ?? null, f.pointer.x, f.pointer.y, f.pointer.radius, f.pointer.strength);
    gl.uniform1f(u2.uE ?? null, e);
    gl.uniform3f(u2.uField1 ?? null, f.colors.f1[0], f.colors.f1[1], f.colors.f1[2]);
    gl.uniform3f(u2.uField2 ?? null, f.colors.f2[0], f.colors.f2[1], f.colors.f2[2]);
    gl.uniform3f(u2.uField3 ?? null, f.colors.f3[0], f.colors.f3[1], f.colors.f3[2]);
    // 12.15: the name's ink is field-3 pushed away from field-0 (darker on the light look, brighter on the dark one);
    // the look's stroke weight follows field-0's luma, so it crossfades with the colour tween
    const c = f.colors;
    const d = this.params.dash;
    const luma = 0.2126 * c.f0[0] + 0.7152 * c.f0[1] + 0.0722 * c.f0[2];
    const light = Math.min(1, Math.max(0, (luma - 0.3) / 0.4));
    const ink = (i: number): number => Math.min(1, Math.max(0, c.f3[i] + (c.f3[i] - c.f0[i]) * d.textInk));
    gl.uniform3f(u2.uInk ?? null, ink(0), ink(1), ink(2));
    gl.uniform4f(u2.uWeight ?? null, 1 + (d.weightLight - 1) * light, d.textWidth, d.textLen, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.target.tex);
    gl.bindVertexArray(this.quad);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, g.cols * g.rows);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  /** P4: reads the pass-1 target (cols × rows × 4 bytes, row j = 0 first); false when not ready, lost or disposed. */
  readSurface(out: Uint8Array): boolean {
    const gl = this.glc;
    const t = this.target;
    if (!gl || !this.isReady || gl.isContextLost() || !t || out.length < t.cols * t.rows * 4) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.readPixels(0, 0, t.cols, t.rows, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return true;
  }

  /** After webglcontextrestored (3.6.3): rebuilds programs, geometry, target and mask. `ready` must be polled again. */
  restore(): boolean {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return false;
    this.p1 = null;
    this.p2 = null;
    this.target = null;
    this.mask = null;
    this.isReady = false;
    this.isFailed = false;
    try {
      this.build(gl);
      if (this.gridValue) this.target = createSurfaceTarget(gl, this.gridValue.cols, this.gridValue.rows);
      if (this.maskPlane) this.mask = createMaskTexture(gl, this.maskPlane.width, this.maskPlane.height, this.maskPlane.data);
    } catch {
      this.isFailed = true;
      return false;
    }
    this.gridDirty = true;
    this.paramsDirty = true;
    return true;
  }

  /** Deletes every GL object; the renderer is inert afterwards and `gl` is null. */
  dispose(): void {
    const gl = this.glc;
    if (!gl) return;
    this.glc = null;
    this.isReady = false;
    if (gl.isContextLost()) return;
    if (this.p1) gl.deleteProgram(this.p1.program);
    if (this.p2) gl.deleteProgram(this.p2.program);
    if (this.target) deleteSurfaceTarget(gl, this.target);
    if (this.mask) gl.deleteTexture(this.mask);
    if (this.emptyMask) gl.deleteTexture(this.emptyMask);
    if (this.tri) {
      gl.deleteVertexArray(this.tri.vao);
      gl.deleteBuffer(this.tri.vbo);
    }
    if (this.quad) gl.deleteVertexArray(this.quad);
    this.p1 = this.p2 = null;
    this.target = null;
    this.mask = this.emptyMask = null;
    this.tri = null;
    this.quad = null;
  }

  private build(gl: WebGL2RenderingContext): void {
    // extensions do not survive a context loss: enable it again on every (re)build
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    this.tri = createFullscreenTriangle(gl);
    this.quad = gl.createVertexArray();
    if (!this.quad) throw new Error('vertex array unavailable (context lost)');
    // a 1 x 1 zero mask keeps texture unit 1 bound while no name is shown (no "no texture bound" render warning)
    this.emptyMask = createMaskTexture(gl, 1, 1, EMPTY_MASK);
    this.pending = [startProgram(gl, fullscreenVert, PASS1_SOURCE, this.parallel), startProgram(gl, PASS2_VERT, dashFrag, this.parallel)];
  }

  private writeParams(gl: WebGL2RenderingContext, u1: Uniforms, u2: Uniforms): void {
    const p = this.params;
    gl.uniform2f(u1.uWarp ?? null, p.pointer.warpK, p.pointer.boost);
    gl.uniform4f(u1.uMaskMix ?? null, p.mask.holdDim, p.mask.ink, p.mask.edge, p.mask.meltPx);
    gl.uniform3f(u1.uShape ?? null, p.shape.warpScalePx, p.shape.mainScalePx, p.shape.warpAmp);
    gl.uniform3f(u1.uLevel ?? null, p.shape.level, p.shape.gain, p.shape.shapeK);
    if (this.p2) {
      gl.useProgram(this.p2.program);
      gl.uniform4f(u2.uDash ?? null, p.dash.lenMin, p.dash.lenK, p.dash.widthK, p.dash.flowAmp);
      gl.uniform4f(u2.uDash2 ?? null, INTENSITY_K[p.intensity], p.dash.repelK, p.dash.flowScalePx, p.dash.angleScalePx);
      gl.uniform2f(u2.uTiers ?? null, p.tiers.t2, p.tiers.t3);
      gl.uniform2f(u2.uAlpha ?? null, p.dash.alphaMin, p.dash.color === 'muted' ? 1 : 0);
      if (this.p1) gl.useProgram(this.p1.program);
    }
  }

  private u1(): Uniforms {
    return this.p1?.uniforms ?? {};
  }

  private u2(): Uniforms {
    return this.p2?.uniforms ?? {};
  }
}
