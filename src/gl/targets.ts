/** Pass 1's render target (spec 4.5.2, Appendix A §3.9): one RGBA8 texel per cell, .r = v. */
export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }

/** RGBA8, NEAREST, CLAMP_TO_EDGE on texture unit 0. Throws (after cleaning up) when the FBO is incomplete. */
export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) throw new Error('surface target unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, cols, rows);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!complete) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    throw new Error('surface framebuffer incomplete');
  }
  return { tex, fbo, cols, rows };
}

/** R8, LINEAR, CLAMP_TO_EDGE on texture unit 1; UNPACK_ALIGNMENT 1, no FLIP_Y or PREMULTIPLY_ALPHA (spec 4.5.7). */
export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('mask texture unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, w, h);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.UNSIGNED_BYTE, plane);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0);
  return tex;
}

/** One triangle covering clip space ([-1, -1, 3, -1, -1, 3], STATIC_DRAW) on attribute 0 (spec 4.5.1). */
export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } {
  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  if (!vao || !vbo) throw new Error('fullscreen triangle unavailable (context lost)');
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { vao, vbo };
}

export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void {
  gl.deleteFramebuffer(t.fbo);
  gl.deleteTexture(t.tex);
}
