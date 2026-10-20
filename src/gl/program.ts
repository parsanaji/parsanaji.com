export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
export const GLSL_HEADER_VERT = '#version 300 es\n';

export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError

/** A compile or link failure; `log` carries the driver's info log (DEV diagnostics, never logged in production). */
export class ShaderError extends Error {
  readonly log: string;
  constructor(message: string, log: string) {
    super(message);
    this.name = 'ShaderError';
    this.log = log;
  }
}

/** Active uniforms by name; array uniforms drop their "[0]" suffix ("uRipples[0]" -> "uRipples"). */
export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation> {
  const out: Record<string, WebGLUniformLocation> = {};
  const n = Number(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)) || 0;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const loc = gl.getUniformLocation(program, info.name);
    if (loc) out[info.name.replace(/\[0\]$/, '')] = loc;
  }
  return out;
}

/**
 * Starts compiling and linking without querying any status (spec 4.7.4 step 5, risk 9.6). With
 * KHR_parallel_shader_compile, ready() polls COMPLETION_STATUS_KHR; without it ready() is true and the
 * caller must call finish() inside an animation frame after first paint. finish() checks the statuses
 * once: later calls return the same handle or throw the same ShaderError.
 */
export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    const lost = new ShaderError('WebGL objects unavailable (context lost)', '');
    return { ready: () => true, finish: () => { throw lost; } };
  }
  gl.shaderSource(vs, GLSL_HEADER_VERT + vert);
  gl.shaderSource(fs, GLSL_HEADER_FRAG + frag);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos'); // 4.5.1: attribute 0 before link
  gl.linkProgram(program);

  let result: ProgramHandle | ShaderError | null = null;
  const release = (): void => {
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
  const check = (): ProgramHandle | ShaderError => {
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return { program, uniforms: uniformMap(gl, program) };
    }
    let error: ShaderError;
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) error = new ShaderError('vertex shader failed to compile', gl.getShaderInfoLog(vs) ?? '');
    else if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) error = new ShaderError('fragment shader failed to compile', gl.getShaderInfoLog(fs) ?? '');
    else error = new ShaderError('program failed to link', gl.getProgramInfoLog(program) ?? '');
    release();
    gl.deleteProgram(program);
    return error;
  };
  return {
    ready: () => result !== null || parallel === null || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR) === true,
    finish: () => {
      result ??= check();
      if (result instanceof ShaderError) throw result;
      return result;
    },
  };
}
