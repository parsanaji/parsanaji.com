/**
 * LinkedIn presence (spec 3.1.12, 11.22). The anchor exists in index.html only once Parsa has given the URL
 * (one commit sets CONTENT.links.linkedin, the <li> and the JSON-LD sameAs together). When both exist, the
 * overlay's `l` row is shown and the `l` shortcut is enabled through the returned flag. Never throws (4.3.1).
 */
export function initLinks(linkedinUrl: string, doc: Document = document): { linkedin: boolean } {
  const linkedin = linkedinUrl !== '' && doc.querySelector('[data-link="linkedin"]') !== null;
  if (linkedin) {
    const row = doc.querySelector<HTMLElement>('[data-key="linkedin"]');
    if (row) row.hidden = false;
  }
  return { linkedin };
}
