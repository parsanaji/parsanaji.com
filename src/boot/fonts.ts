export interface FontFaceSetLike {
  load(font: string): Promise<unknown>;
}

export type FontWaitResult = 'loaded' | 'timeout' | 'unavailable';

/** Resolves when the font is usable or after `timeoutMs`, whichever comes first. Never rejects (spec 3.8). */
export function waitForFont(
  spec: string,
  timeoutMs: number,
  fonts: FontFaceSetLike | undefined = typeof document !== 'undefined' ? document.fonts : undefined,
  schedule: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
): Promise<FontWaitResult> {
  if (!fonts) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: FontWaitResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    schedule(() => finish('timeout'), timeoutMs);
    fonts.load(spec).then(
      () => finish('loaded'),
      () => finish('timeout'),
    );
  });
}
