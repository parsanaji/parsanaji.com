import { describe, expect, it } from 'vitest';
import { hasWebGL2 } from '../src/boot/webgl';

const fakeCanvas = (getContext: (type: string) => unknown) => () => ({ getContext }) as unknown as HTMLCanvasElement;

describe('hasWebGL2', () => {
  it('is true when a WebGL2 context comes back, and releases the probe context', () => {
    let released = 0;
    const gl = { getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext: () => void released++ } : null) };
    const requested: string[] = [];
    expect(
      hasWebGL2(
        fakeCanvas((type) => {
          requested.push(type);
          return gl;
        }),
      ),
    ).toBe(true);
    expect(requested).toEqual(['webgl2']);
    expect(released).toBe(1);
  });

  it('is false when getContext returns null', () => {
    expect(hasWebGL2(fakeCanvas(() => null))).toBe(false);
  });

  it('is false when getContext throws', () => {
    expect(
      hasWebGL2(
        fakeCanvas(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBe(false);
  });
});
