/** Spec 4.3 / 3.6.2: no alpha, no AA, no depth or stencil; software GL counts as no WebGL2. */
export const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
  preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
};

/** The page's one WebGL2 context, or null (no WebGL2, a major performance caveat, or a throwing getContext). Never throws. */
export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs: WebGLContextAttributes = GL_ATTRIBUTES): WebGL2RenderingContext | null {
  try {
    return canvas.getContext('webgl2', attrs) ?? null;
  } catch {
    return null;
  }
}
