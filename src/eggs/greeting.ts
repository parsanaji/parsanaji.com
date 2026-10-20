import { CONTENT } from '../content';

const STYLE = 'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0';

/** 3.5.7 (R12d): the one console line, and the only production log. Defaults are read at call time. */
export function greet(log: (...args: unknown[]) => void = console.log, email: string = CONTENT.email): void {
  log(`%cParsa Naji — say hi: ${email}`, STYLE);
}
