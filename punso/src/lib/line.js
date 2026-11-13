// The shop's LINE contact can be saved either as an OA id ("@punso") or as a full
// add-friend link ("https://line.me/ti/p/…"). These helpers handle both.
const raw = (v) => String(v || '').trim();
export const isLineUrl = (v) => /^https?:\/\//i.test(raw(v));

export function lineChatUrl(v) {
  const id = raw(v);
  if (!id) return null;
  if (isLineUrl(id)) return id;
  return `https://line.me/R/ti/p/${encodeURIComponent(id.startsWith('@') ? id : `@${id}`)}`;
}

// Opens a chat with the message pre-typed — only possible with an OA id
export function lineMessageUrl(v, text) {
  const id = raw(v);
  if (!id || isLineUrl(id)) return null;
  return `https://line.me/R/oaMessage/${encodeURIComponent(id.startsWith('@') ? id : `@${id}`)}/?${encodeURIComponent(text)}`;
}

export const lineLabel = (v) => (isLineUrl(v) ? 'ของร้าน' : raw(v));
