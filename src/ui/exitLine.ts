/** Shows the LinkedIn link (and its separator) only when a URL exists. */
export function initExitLine(linkedinUrl: string, doc: Document = document): void {
  const link = doc.getElementById('linkedin');
  const sep = doc.getElementById('linkedin-sep');
  if (!(link instanceof HTMLAnchorElement) || !sep) return;
  if (!linkedinUrl) return;
  link.href = linkedinUrl;
  link.hidden = false;
  sep.hidden = false;
}
