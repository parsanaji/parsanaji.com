import { describe, expect, it } from 'vitest';
import { GLSL_HEADER_FRAG, GLSL_HEADER_VERT, ShaderError, startProgram, uniformMap } from '../src/gl/program';

const COMPLETION_STATUS_KHR = 0x91b1;

interface FakeOptions {
  vertOk?: boolean;
  fragOk?: boolean;
  linkOk?: boolean;
  uniforms?: string[];
  /** COMPLETION_STATUS_KHR answers, consumed one per query */
  completion?: boolean[];
}

/** A fake WebGL2 context with just the program API, recording the order of calls. */
function fakeGl(o: FakeOptions = {}) {
  const log: string[] = [];
  const sources: string[] = [];
  const completion = [...(o.completion ?? [])];
  let id = 0;
  const shaders = new Map<object, number>();
  const gl = {
    VERTEX_SHADER: 0x8b31, FRAGMENT_SHADER: 0x8b30, COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82, ACTIVE_UNIFORMS: 0x8b86,
    createShader(type: number) {
      const s = { id: ++id };
      shaders.set(s, type);
      return s;
    },
    createProgram: () => ({ id: ++id }),
    shaderSource: (_s: object, src: string) => void sources.push(src),
    compileShader: () => void log.push('compileShader'),
    attachShader: () => void log.push('attachShader'),
    bindAttribLocation: (_p: object, index: number, name: string) => void log.push(`bindAttribLocation ${index} ${name}`),
    linkProgram: () => void log.push('linkProgram'),
    getShaderParameter(s: object) {
      log.push('getShaderParameter');
      return shaders.get(s) === 0x8b31 ? (o.vertOk ?? true) : (o.fragOk ?? true);
    },
    getShaderInfoLog: (s: object) => (shaders.get(s) === 0x8b31 ? 'vert log' : "ERROR: 0:12: 'uOops' : undeclared identifier"),
    getProgramParameter(_p: object, pname: number) {
      log.push(`getProgramParameter ${pname.toString(16)}`);
      if (pname === 0x8b82) return (o.vertOk ?? true) && (o.fragOk ?? true) && (o.linkOk ?? true);
      if (pname === 0x8b86) return (o.uniforms ?? []).length;
      if (pname === COMPLETION_STATUS_KHR) return completion.shift() ?? true;
      return null;
    },
    getProgramInfoLog: () => 'link log: varying mismatch',
    getActiveUniform: (_p: object, i: number) => ({ name: (o.uniforms ?? [])[i], size: 1, type: 0 }),
    getUniformLocation: (_p: object, name: string) => ({ name }),
    detachShader: () => void log.push('detachShader'),
    deleteShader: () => void log.push('deleteShader'),
    deleteProgram: () => void log.push('deleteProgram'),
  };
  return { gl: gl as unknown as WebGL2RenderingContext, log, sources };
}

const parallel = { COMPLETION_STATUS_KHR } as KHR_parallel_shader_compile;

describe('GLSL headers (spec 4.3)', () => {
  it('are exact', () => {
    expect(GLSL_HEADER_FRAG).toBe('#version 300 es\nprecision highp float;\nprecision highp int;\n');
    expect(GLSL_HEADER_VERT).toBe('#version 300 es\n');
  });
});

describe('startProgram', () => {
  it('prepends the headers and binds attribute 0 to aPos before linking (4.5.1)', () => {
    const { gl, log, sources } = fakeGl();
    startProgram(gl, 'VERT', 'FRAG', null);
    expect(sources).toEqual([`${GLSL_HEADER_VERT}VERT`, `${GLSL_HEADER_FRAG}FRAG`]);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeLessThan(log.indexOf('linkProgram'));
    expect(log.some((l) => l.startsWith('get'))).toBe(false); // no status query at start (risk 9.6)
  });

  it('is ready at once without KHR_parallel_shader_compile', () => {
    const { gl } = fakeGl();
    expect(startProgram(gl, 'v', 'f', null).ready()).toBe(true);
  });

  it('polls COMPLETION_STATUS_KHR with the extension', () => {
    const { gl, log } = fakeGl({ completion: [false, false, true] });
    const p = startProgram(gl, 'v', 'f', parallel);
    expect([p.ready(), p.ready(), p.ready()]).toEqual([false, false, true]);
    expect(log.filter((l) => l === `getProgramParameter ${COMPLETION_STATUS_KHR.toString(16)}`)).toHaveLength(3);
  });

  it('finish() returns the program and its uniform map once linked, checking the status once', () => {
    const { gl, log } = fakeGl({ uniforms: ['uCell', 'uRipples[0]'] });
    const p = startProgram(gl, 'v', 'f', null);
    const h = p.finish();
    expect(Object.keys(h.uniforms)).toEqual(['uCell', 'uRipples']);
    expect(p.finish()).toBe(h);
    expect(log.filter((l) => l === 'getProgramParameter 8b82')).toHaveLength(1);
  });

  it('turns a compile failure into a ShaderError carrying the info log', () => {
    const { gl, log } = fakeGl({ fragOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    let caught: unknown;
    try {
      p.finish();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ShaderError);
    expect((caught as ShaderError).message).toBe('fragment shader failed to compile');
    expect((caught as ShaderError).log).toContain("'uOops' : undeclared identifier");
    expect(() => p.finish()).toThrow(caught as ShaderError); // same error on every later call
    expect(log).toContain('deleteProgram');
  });

  it('turns a link failure into a ShaderError carrying the program log', () => {
    const { gl } = fakeGl({ linkOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    expect(() => p.finish()).toThrow(ShaderError);
    try {
      p.finish();
    } catch (error) {
      expect((error as ShaderError).message).toBe('program failed to link');
      expect((error as ShaderError).log).toBe('link log: varying mismatch');
    }
  });

  it('reports a context that cannot create objects as a ShaderError instead of throwing at start', () => {
    const { gl } = fakeGl();
    (gl as unknown as { createShader: () => null }).createShader = () => null;
    const p = startProgram(gl, 'v', 'f', null);
    expect(p.ready()).toBe(true);
    expect(() => p.finish()).toThrow(ShaderError);
  });
});

describe('uniformMap', () => {
  it('strips the [0] suffix of array uniforms', () => {
    const { gl } = fakeGl({ uniforms: ['uCell', 'uRipples[0]', 'uMask'] });
    const map = uniformMap(gl, {} as WebGLProgram);
    expect(Object.keys(map)).toEqual(['uCell', 'uRipples', 'uMask']);
    expect(map.uRipples).toEqual({ name: 'uRipples[0]' });
  });
});

describe('ShaderError', () => {
  it('is an Error with a name and a log', () => {
    const e = new ShaderError('boom', 'details');
    expect(e).toBeInstanceOf(Error);
    expect([e.name, e.message, e.log]).toEqual(['ShaderError', 'boom', 'details']);
  });
});
