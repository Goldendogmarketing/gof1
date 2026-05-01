import { z } from "zod";
import type { ExternalProduct, ProductFeedAdapter, ProductFeedFetchOptions } from "@/lib/product-feed/types";

const feedProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().optional(),
  flavor: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  priceCents: z.number().optional(),
  compareAtPrice: z.union([z.number(), z.string()]).optional().nullable(),
  compareAtCents: z.number().optional().nullable(),
  currency: z.string().optional(),
  inventoryQuantity: z.number().optional(),
  images: z.array(z.union([z.string(), z.object({ url: z.string() })])).optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional()
});

const feedSchema = z.union([
  z.array(feedProductSchema),
  z.object({ products: z.array(feedProductSchema) })
]);

function cents(value: string | number | undefined | null) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return Math.round(value * 100);
  return Math.round(Number.parseFloat(value.replace(/[^0-9.]/g, "")) * 100);
}

export function aristonJsonFeedAdapter(): ProductFeedAdapter {
  return {
    name: "ariston-json",
    async fetchProducts(options?: ProductFeedFetchOptions): Promise<ExternalProduct[]> {
      if (!process.env.PRODUCT_FEED_URL) {
        throw new Error("PRODUCT_FEED_URL is required for the ariston-json adapter.");
      }

      const response = await fetch(process.env.PRODUCT_FEED_URL, {
        headers: process.env.PRODUCT_FEED_TOKEN
          ? {
              Authorization: `Bearer ${process.env.PRODUCT_FEED_TOKEN}`
            }
          : undefined,
        ...(options?.cache === "no-store" ? { cache: "no-store" as const } : { next: { revalidate: 300 } })
      });

      if (!response.ok) {
        throw new Error(`Product feed failed with ${response.status}.`);
      }

      const parsed = feedSchema.parse(await response.json());
      const products = Array.isArray(parsed) ? parsed : parsed.products;

      return products.map((product) => ({
        externalId: String(product.id),
        title: product.title,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        category: product.category,
        categorySlug: product.categorySlug,
        flavor: product.flavor,
        size: product.size,
        sku: product.sku,
        priceCents: product.priceCents ?? cents(product.price) ?? 0,
        compareAtCents: product.compareAtCents ?? cents(product.compareAtPrice) ?? null,
        currency: product.currency ?? "USD",
        inventoryQuantity: product.inventoryQuantity,
        imageUrls: product.images?.map((image) => (typeof image === "string" ? image : image.url)),
        tags: product.tags,
        isPublished: product.published
      }));
    }
  };
}
