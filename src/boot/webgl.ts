/** three r163+ needs WebGL2. Probe on a scratch canvas so the real one stays untouched. */
export function hasWebGL2(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    return createCanvas().getContext('webgl2') !== null;
  } catch {
    return false;
  }
}
