// HTML-entity decoding for metadata strings.
//
// Feed descriptions arrive HTML-encoded, and some are DOUBLE-encoded — the
// upstream stored `&#8230;` and then the feed encoded the ampersand again, so we
// receive the literal text `&amp;#8230;`. Rendered in a <title>/<meta> that
// shows up verbatim as "&amp;#8230;" instead of an ellipsis. We decode twice to
// collapse the double encoding, then map the common named/numeric entities.

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " "
};

function decodeOnce(value: string): string {
  let out = value;

  // Named entities first (covers the &amp; that hides a double encoding).
  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    out = out.split(entity).join(char);
  }

  // Numeric entities: decimal (&#8230;) and hex (&#x2026;).
  out = out.replace(/&#(\d+);/g, (_, code) => safeFromCodePoint(Number.parseInt(code, 10)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, code) => safeFromCodePoint(Number.parseInt(code, 16)));

  return out;
}

function safeFromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/**
 * Decode HTML entities, handling the double-encoded `&amp;#NNN;` case. Idempotent
 * on already-plain text. Strips any leftover tags and collapses whitespace so the
 * result is safe to drop into a <title>/<meta description>.
 */
export function decodeEntities(value: string | null | undefined): string {
  if (!value) return "";
  // Two passes collapse `&amp;#8230;` -> `&#8230;` -> "…".
  const decoded = decodeOnce(decodeOnce(value));
  return decoded
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
