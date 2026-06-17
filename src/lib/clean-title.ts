// Title normalization for the product feed.
//
// Live WooCommerce / Ariston feed titles arrive as raw merchandising strings,
// e.g. `Ariston Basil Infused Olive oil 8.45 fl oz Code#679` or 90-character
// bundle titles ending in `Bundle!`. These strings flow into product cards, the
// PDP <h1>, AND the SEO <title>, so we clean them once at the data layer.
//
// The cleaner is intentionally conservative: it strips machine artifacts (SKU
// codes, trailing size tokens), collapses whitespace, fixes a few known casing
// slips, and caps absurd lengths. It never invents words. The captured size
// token (when the product has no explicit size) is returned separately so the
// caller can backfill the empty `size` field — this fixes the empty-Size spec.

const MAX_TITLE_LENGTH = 70;

// Matches a SKU suffix like "Code#679" / "code # 12" anywhere in the string.
const SKU_CODE_RE = /\bcode\s*#\s*\d+\b/gi;

// Matches a trailing size/volume token such as "8.45 fl oz", "190g", "250 ml",
// "1 L", "3 x 250ml". Anchored to the end so we only lift sizes that trail the
// real product name (and never chop a size that is genuinely part of the name).
const TRAILING_SIZE_RE =
  /[\s,(-]*\b(\d+(?:\.\d+)?\s*(?:x\s*\d+(?:\.\d+)?\s*)?(?:fl\s*oz|fluid\s*ounces?|oz|ounces?|ml|milliliters?|l|liters?|litres?|g|grams?|kg|cl)\b)\s*\)?\s*$/i;

// Known casing fixes applied as whole-word, case-insensitive replacements.
// Keeps brand-correct presentation regardless of how the feed cased them.
const CASING_FIXES: Array<[RegExp, string]> = [
  [/\bolive\s+oil\b/gi, "Olive Oil"],
  [/\bextra\s+virgin\b/gi, "Extra Virgin"],
  [/\bevoo\b/gi, "EVOO"],
  [/\bfl\s*oz\b/gi, "fl oz"]
];

function normalizeSizeToken(raw: string): string {
  // Tidy spacing/casing on a captured size token: "8.45 FL OZ" -> "8.45 fl oz".
  return raw
    .replace(/\s+/g, " ")
    .replace(/\bFL\s*OZ\b/gi, "fl oz")
    .replace(/\bML\b/gi, "ml")
    .replace(/\bOZ\b/gi, "oz")
    .trim();
}

export type CleanedTitle = {
  /** Display-safe title with SKU codes and trailing size tokens removed. */
  title: string;
  /** Size token lifted off the end of the title, if one was found. */
  size?: string;
};

/**
 * Clean a raw feed title into a display-safe name and lift any trailing size
 * token. Pure and side-effect free; safe to call on already-clean titles
 * (demo/DB products pass through essentially unchanged).
 */
export function cleanProductTitle(rawTitle: string | null | undefined): CleanedTitle {
  if (!rawTitle) return { title: "" };

  // 1. Strip SKU codes (Code#679) wherever they appear.
  let title = rawTitle.replace(SKU_CODE_RE, " ");

  // 2. Collapse whitespace so the size regex anchors cleanly.
  title = title.replace(/\s+/g, " ").trim();

  // 3. Lift a trailing size/volume token, if present.
  let size: string | undefined;
  const sizeMatch = title.match(TRAILING_SIZE_RE);
  if (sizeMatch) {
    size = normalizeSizeToken(sizeMatch[1]);
    title = title.slice(0, sizeMatch.index).trim();
  }

  // 4. Apply known casing fixes.
  for (const [pattern, replacement] of CASING_FIXES) {
    title = title.replace(pattern, replacement);
  }

  // 5. Collapse any whitespace introduced above and trim dangling punctuation.
  title = title.replace(/\s+/g, " ").replace(/[\s,;:–—-]+$/u, "").trim();

  // 6. Cap absurd bundle-title length gracefully — cut on a word boundary and
  //    append an ellipsis rather than slicing mid-word.
  if (title.length > MAX_TITLE_LENGTH) {
    const truncated = title.slice(0, MAX_TITLE_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");
    title = (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).replace(/[\s,;:–—-]+$/u, "").trim() + "…";
  }

  return size ? { title, size } : { title };
}

/** Convenience wrapper when only the display title is needed. */
export function cleanTitle(rawTitle: string | null | undefined): string {
  return cleanProductTitle(rawTitle).title;
}
