import { slugify } from "@/lib/format";
import type { ExternalProduct, NormalizedProduct } from "@/lib/product-feed/types";

export function normalizeExternalProduct(product: ExternalProduct): NormalizedProduct {
  const categoryName = product.category?.trim() || "Olive Oil";
  const categorySlug = product.categorySlug?.trim() || slugify(categoryName);
  const slug = product.slug?.trim() || slugify(product.title);

  return {
    externalId: product.externalId,
    title: product.title.trim(),
    slug,
    description:
      product.description?.trim() ||
      `${product.title.trim()} from Greek Olive Fusion, selected for aroma, texture, and Mediterranean table pairings.`,
    shortDescription:
      product.shortDescription?.trim() ||
      `${product.title.trim()} selected for premium Mediterranean cooking and finishing.`,
    categoryName,
    categorySlug,
    flavor: product.flavor?.trim(),
    size: product.size?.trim(),
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
