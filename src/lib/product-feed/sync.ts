import { prisma, hasDatabaseUrl } from "@/lib/db";
import { getProductFeedAdapter } from "@/lib/product-feed/adapter";
import { normalizeExternalProduct } from "@/lib/product-feed/normalize";

export async function syncProductFeed(source = "manual") {
  const adapter = getProductFeedAdapter();
  const startedAt = new Date();

  if (!hasDatabaseUrl()) {
    const products = await adapter.fetchProducts({ cache: "no-store" });
    return {
      source,
      adapter: adapter.name,
      status: "SKIPPED_NO_DATABASE",
      productsSeen: products.length,
      productsUpserted: 0,
      startedAt,
      finishedAt: new Date()
    };
  }

  const log = await prisma.apiSyncLog.create({
    data: {
      source,
      status: "STARTED",
      startedAt,
      metadata: { adapter: adapter.name }
    }
  });

  try {
    const externalProducts = await adapter.fetchProducts({ cache: "no-store" });
    const products = externalProducts.map(normalizeExternalProduct);
    let upserted = 0;

    for (const product of products) {
      const category = await prisma.productCategory.upsert({
        where: { slug: product.categorySlug },
        update: { name: product.categoryName },
        create: {
          name: product.categoryName,
          slug: product.categorySlug
        }
      });

      // Look up the existing product (if any) so we can respect admin price overrides.
      const existing = await prisma.product.findUnique({
        where: { externalId: product.externalId },
        select: { id: true, priceOverridden: true }
      });

      // Common fields that always reflect the feed.
      const sharedUpdate = {
        title: product.title,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        currency: product.currency,
        flavor: product.flavor,
        size: product.size,
        tags: product.tags,
        status: product.isPublished ? ("ACTIVE" as const) : ("DRAFT" as const),
        categoryId: category.id,
        publishedAt: product.isPublished ? new Date() : null,
        // Always snapshot the latest feed price so the admin can see (and reset to) it.
        feedPriceCents: product.priceCents,
        feedCompareAtCents: product.compareAtCents ?? null
      };

      // Only overwrite the live displayed price when the admin has not pinned an override.
      const updateData = existing?.priceOverridden
        ? sharedUpdate
        : {
            ...sharedUpdate,
            priceCents: product.priceCents,
            compareAtCents: product.compareAtCents
          };

      const saved = await prisma.product.upsert({
        where: { externalId: product.externalId },
        update: updateData,
        create: {
          externalId: product.externalId,
          ...sharedUpdate,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          priceOverridden: false
        }
      });

      await prisma.inventory.upsert({
        where: { productId: saved.id },
        update: {
          quantity: product.inventoryQuantity,
          visible: true
        },
        create: {
          productId: saved.id,
          quantity: product.inventoryQuantity,
          visible: true
        }
      });

      await prisma.productImage.deleteMany({ where: { productId: saved.id } });
      await prisma.productImage.createMany({
        data: product.imageUrls.map((url, index) => ({
          productId: saved.id,
          url,
          alt: `${product.title} product image ${index + 1}`,
          sortOrder: index,
          isPrimary: index === 0
        }))
      });

      upserted += 1;
    }

    await prisma.apiSyncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        productsSeen: products.length,
        productsUpserted: upserted,
        message: `Synced ${upserted} products from ${adapter.name}.`
      }
    });

    return {
      source,
      adapter: adapter.name,
      status: "SUCCESS",
      productsSeen: products.length,
      productsUpserted: upserted,
      startedAt,
      finishedAt: new Date()
    };
  } catch (error) {
    await prisma.apiSyncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message: error instanceof Error ? error.message : "Unknown sync error"
      }
    });

    throw error;
  }
}
