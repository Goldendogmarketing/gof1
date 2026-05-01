import { demoProducts } from "@/lib/demo-data";
import type { ExternalProduct, ProductFeedAdapter } from "@/lib/product-feed/types";

export const demoProductFeedAdapter: ProductFeedAdapter = {
  name: "demo",
  async fetchProducts(): Promise<ExternalProduct[]> {
    return demoProducts.map((product) => ({
      externalId: product.externalId ?? product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category,
      categorySlug: product.categorySlug,
      flavor: product.flavor ?? undefined,
      size: product.size ?? undefined,
      priceCents: product.priceCents,
      compareAtCents: product.compareAtCents,
      currency: product.currency,
      inventoryQuantity: product.inventory.quantity,
      imageUrls: product.images.map((image) => image.url),
      tags: product.tags,
      isPublished: true
    }));
  }
};
