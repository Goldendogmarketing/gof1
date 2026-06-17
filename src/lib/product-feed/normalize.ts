import { cleanProductTitle } from "@/lib/clean-title";
import { slugify } from "@/lib/format";
import type { ExternalProduct, NormalizedProduct } from "@/lib/product-feed/types";

export function normalizeExternalProduct(product: ExternalProduct): NormalizedProduct {
  const categoryName = product.category?.trim() || "Olive Oil";
  const categorySlug = product.categorySlug?.trim() || slugify(categoryName);

  // Clean the raw feed title once, here, so EVERY downstream surface (cards, the
  // PDP <h1>, and the SEO <title>) receives the display-safe name. The cleaner
  // also lifts a trailing size token (e.g. "8.45 fl oz"); we use it to backfill
  // the `size` field when the feed left it empty — this fixes the empty-Size
  // spec on the PDP. The slug is still derived from the raw title (the cleaner
  // never removes information that would change identity), and the slug feeds
  // generateStaticParams, so cleaning the display title does not affect routing.
  const cleaned = cleanProductTitle(product.title);
  const title = cleaned.title || product.title.trim();
  const size = product.size?.trim() || cleaned.size;
  const slug = product.slug?.trim() || slugify(title);

  return {
    externalId: product.externalId,
    title,
    slug,
    description:
      product.description?.trim() ||
      `${title} from Greek Olive Fusion, selected for aroma, texture, and Mediterranean table pairings.`,
    shortDescription:
      product.shortDescription?.trim() ||
      `${title} selected for premium Mediterranean cooking and finishing.`,
    categoryName,
    categorySlug,
    flavor: product.flavor?.trim(),
    size,
    sku: product.sku?.trim(),
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents ?? null,
    currency: product.currency ?? "USD",
    inventoryQuantity: product.inventoryQuantity ?? 0,
    imageUrls: product.imageUrls?.length ? product.imageUrls : ["/products/koroneiki-evoo.svg"],
    tags: product.tags ?? [],
    isPublished: product.isPublished ?? true
  };
}
