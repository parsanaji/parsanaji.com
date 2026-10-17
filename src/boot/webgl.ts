/** three r163+ needs WebGL2. Probe on a scratch canvas so the real one stays untouched. */
export function hasWebGL2(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    const gl = createCanvas().getContext('webgl2');
    if (gl === null) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context; the App creates its own
    return true;
  } catch {
    return false;
  }
}
