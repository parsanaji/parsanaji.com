import { describe, expect, it } from 'vitest';
import { GL_ATTRIBUTES, createContext } from '../src/gl/context';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget } from '../src/gl/targets';

type Canvas = Pick<HTMLCanvasElement, 'getContext'>;
const canvasReturning = (getContext: (type: string, attrs: unknown) => unknown): Canvas => ({ getContext }) as unknown as Canvas;

describe('createContext (spec 3.6.2)', () => {
  it('requests webgl2 with GL_ATTRIBUTES and returns the context', () => {
    const gl = { tag: 'gl' };
    const calls: [string, unknown][] = [];
    const ctx = createContext(
      canvasReturning((type, attrs) => {
        calls.push([type, attrs]);
        return gl;
      }),
    );
    expect(ctx).toBe(gl);
    expect(calls).toEqual([['webgl2', GL_ATTRIBUTES]]);
  });

  it('returns null when getContext returns null', () => {
    expect(createContext(canvasReturning(() => null))).toBeNull();
  });

  it('returns null when getContext throws', () => {
    expect(
      createContext(
        canvasReturning(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBeNull();
  });

  it('GL_ATTRIBUTES is exactly the spec 4.3 object', () => {
    expect(GL_ATTRIBUTES).toEqual({
      alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
    });
  });
});

/** Records every call on a fake WebGL2 context; `fbStatus` is what checkFramebufferStatus returns. */
function recordingGl(fbStatus = 0x8cd5) {
  const calls: [string, ...unknown[]][] = [];
  let next = 0;
  const C = {
    TEXTURE_2D: 0x0de1, TEXTURE0: 0x84c0, TEXTURE1: 0x84c1, RGBA8: 0x8058, R8: 0x8229, RED: 0x1903, UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600, LINEAR: 0x2601, CLAMP_TO_EDGE: 0x812f, TEXTURE_MIN_FILTER: 0x2801, TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, FRAMEBUFFER: 0x8d40, COLOR_ATTACHMENT0: 0x8ce0, FRAMEBUFFER_COMPLETE: 0x8cd5,
    UNPACK_ALIGNMENT: 0x0cf5, UNPACK_FLIP_Y_WEBGL: 0x9240, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241, ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4, FLOAT: 0x1406,
  };
  const gl = new Proxy(C as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
        if (prop.startsWith('create')) return { id: ++next, kind: prop };
        if (prop === 'checkFramebufferStatus') return fbStatus;
        return undefined;
      };
    },
  }) as unknown as WebGL2RenderingContext;
  return { gl, calls, C };
}

describe('createSurfaceTarget (spec 4.5.2)', () => {
  it('allocates an RGBA8 cols x rows texture, NEAREST and CLAMP_TO_EDGE, on unit 0, attached to an FBO', () => {
    const { gl, calls, C } = recordingGl();
    const t = createSurfaceTarget(gl, 288, 180);
    expect([t.cols, t.rows]).toEqual([288, 180]);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE0]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.RGBA8, 288, 180]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.NEAREST]);
    for (const pname of [C.TEXTURE_WRAP_S, C.TEXTURE_WRAP_T]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.CLAMP_TO_EDGE]);
    expect(calls).toContainEqual(['framebufferTexture2D', C.FRAMEBUFFER, C.COLOR_ATTACHMENT0, C.TEXTURE_2D, t.tex, 0]);
    expect(calls.at(-1)).toEqual(['bindFramebuffer', C.FRAMEBUFFER, null]);
  });

  it('throws and deletes both objects when the framebuffer is incomplete', () => {
    const { gl, calls } = recordingGl(0x8cd6);
    expect(() => createSurfaceTarget(gl, 4, 4)).toThrow('surface framebuffer incomplete');
    expect(calls.map((c) => c[0])).toEqual(expect.arrayContaining(['deleteFramebuffer', 'deleteTexture']));
  });

  it('deleteSurfaceTarget deletes the FBO and the texture', () => {
    const { gl, calls } = recordingGl();
    const t = createSurfaceTarget(gl, 2, 2);
    deleteSurfaceTarget(gl, t);
    expect(calls.slice(-2)).toEqual([
      ['deleteFramebuffer', t.fbo],
      ['deleteTexture', t.tex],
    ]);
  });
});

describe('createMaskTexture (spec 4.5.7)', () => {
  it('uploads an R8 plane to unit 1 with UNPACK_ALIGNMENT 1, LINEAR, CLAMP_TO_EDGE and no FLIP_Y or PREMULTIPLY', () => {
    const { gl, calls, C } = recordingGl();
    const plane = new Uint8Array(6 * 4);
    createMaskTexture(gl, 6, 4, plane);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE1]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.R8, 6, 4]);
    expect(calls).toContainEqual(['pixelStorei', C.UNPACK_ALIGNMENT, 1]);
    expect(calls).toContainEqual(['texSubImage2D', C.TEXTURE_2D, 0, 0, 0, 6, 4, C.RED, C.UNSIGNED_BYTE, plane]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.LINEAR]);
    const pixelStores = calls.filter((c) => c[0] === 'pixelStorei').map((c) => c[1]);
    expect(pixelStores).not.toContain(C.UNPACK_FLIP_Y_WEBGL);
    expect(pixelStores).not.toContain(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  });
});

describe('createFullscreenTriangle (spec 4.5.1)', () => {
  it('binds [-1, -1, 3, -1, -1, 3] as STATIC_DRAW to attribute 0', () => {
    const { gl, calls, C } = recordingGl();
    const { vao } = createFullscreenTriangle(gl);
    const data = calls.find((c) => c[0] === 'bufferData');
    expect(Array.from(data?.[2] as Float32Array)).toEqual([-1, -1, 3, -1, -1, 3]);
    expect(data?.[3]).toBe(C.STATIC_DRAW);
    expect(calls).toContainEqual(['bindVertexArray', vao]);
    expect(calls).toContainEqual(['enableVertexAttribArray', 0]);
    expect(calls).toContainEqual(['vertexAttribPointer', 0, 2, C.FLOAT, false, 0, 0]);
  });
});
