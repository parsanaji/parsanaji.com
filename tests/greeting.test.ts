import { describe, expect, it, vi } from 'vitest';
import { greet } from '../src/eggs/greeting';

describe('greet (spec 3.5.7, 8.1.15)', () => {
  it('logs exactly one styled line with the email', () => {
    const log = vi.fn();
    greet(log);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]).toEqual([
      '%cParsa Naji — say hi: info@parsanaji.com',
      'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0',
    ]);
  });

  it('defaults to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    greet();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('%cParsa Naji — say hi: info@parsanaji.com');
    spy.mockRestore();
  });
});
