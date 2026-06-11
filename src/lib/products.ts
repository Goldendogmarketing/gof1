import { prisma, hasDatabaseUrl } from "@/lib/db";
import { demoJourneyScenes, demoProducts } from "@/lib/demo-data";
import { getProductFeedAdapter } from "@/lib/product-feed/adapter";
import { normalizeExternalProduct } from "@/lib/product-feed/normalize";
import type { JourneySceneView, StoreProduct } from "@/lib/types";

type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
  category?: { name: string; slug: string } | null;
  images?: Array<{ url: string; alt: string; sortOrder: number; isPrimary: boolean }>;
  inventory?: { quantity: number; visible: boolean } | null;
};

function mapProduct(row: ProductRow): StoreProduct {
  const sortedImages = [...(row.images ?? [])].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  return {
    id: row.id,
    externalId: row.externalId,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    shortDescription: row.shortDescription,
    category: row.category?.name ?? "Olive Oil",
    categorySlug: row.category?.slug ?? "olive-oil",
    flavor: row.flavor,
    size: row.size,
    tags: row.tags,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents,
    priceOverridden: row.priceOverridden,
    feedPriceCents: row.feedPriceCents,
    feedCompareAtCents: row.feedCompareAtCents,
    currency: row.currency,
    image: sortedImages[0]?.url ?? "/products/koroneiki-evoo.svg",
    images: sortedImages.length ? sortedImages.map(({ url, alt }) => ({ url, alt })) : [],
    isFeatured: row.isFeatured,
    featuredRank: row.featuredRank,
    inventory: {
      quantity: row.inventory?.quantity ?? 0,
      visible: row.inventory?.visible ?? true
    }
  };
}

let liveFeedCache: { expiresAt: number; products: StoreProduct[] } | null = null;

function isLiveFeedConfigured() {
  const adapter = process.env.PRODUCT_FEED_ADAPTER;
  return adapter && adapter !== "demo";
}

function mapNormalizedProduct(product: ReturnType<typeof normalizeExternalProduct>, index: number): StoreProduct {
  const image = product.imageUrls[0] ?? "/products/koroneiki-evoo.svg";

  return {
    id: product.externalId,
    externalId: product.externalId,
    slug: product.slug,
    title: product.title,
    subtitle: product.flavor ?? product.categoryName,
    description: product.description,
    shortDescription: product.shortDescription,
    category: product.categoryName,
    categorySlug: product.categorySlug,
    flavor: product.flavor,
    size: product.size,
    tags: product.tags,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    currency: product.currency,
    image,
    images: product.imageUrls.map((url) => ({ url, alt: product.title })),
    isFeatured: product.tags.includes("featured") || index < 8,
    featuredRank: index + 1,
    inventory: {
      quantity: product.inventoryQuantity,
      visible: true
    }
  };
}

async function safeLiveFeedProducts() {
  if (!isLiveFeedConfigured()) return null;
  if (liveFeedCache && liveFeedCache.expiresAt > Date.now()) return liveFeedCache.products;

  try {
    const adapter = getProductFeedAdapter();
    const products = (await adapter.fetchProducts())
      .map(normalizeExternalProduct)
      .filter((product) => product.isPublished && product.priceCents > 0)
      .map(mapNormalizedProduct);

    liveFeedCache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      products
    };

    return products.length ? products : null;
  } catch (error) {
    console.warn("Falling back to demo products after live feed failure:", error);
    return null;
  }
}

async function safeDbProducts() {
  if (!hasDatabaseUrl()) return null;

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        category: true,
        images: true,
        inventory: true
      },
      orderBy: [{ isFeatured: "desc" }, { featuredRank: "asc" }, { title: "asc" }]
    });

    return products.length ? products.map(mapProduct) : null;
  } catch (error) {
    console.warn("Falling back to demo products:", error);
    return null;
  }
}

export async function getProducts() {
  const dbProducts = await safeDbProducts();
  const liveFeedProducts = dbProducts ? null : await safeLiveFeedProducts();
  return dbProducts ?? liveFeedProducts ?? demoProducts;
}

export async function getFeaturedProducts() {
  const products = await getProducts();
  const featured = products.filter((product) => product.isFeatured);

  // Falls back to the first 8 products if nothing is flagged so the homepage
  // never goes blank during initial setup.
  const pool = featured.length ? featured : products.slice(0, 8);

  // Fisher-Yates shuffle so each homepage render picks a fresh selection.
  // The page is wrapped in revalidate=60, so visitors within the same minute
  // see the same 4 — but each minute brings new picks. Use a fresh copy so
  // the underlying products array isn't mutated.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 8);
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getProductFacets() {
  const products = await getProducts();
  return {
    categories: Array.from(new Map(products.map((product) => [product.categorySlug, product.category])).entries()).map(
      ([slug, name]) => ({ slug, name })
    ),
    flavors: Array.from(new Set(products.map((product) => product.flavor).filter(Boolean))) as string[],
    sizes: Array.from(new Set(products.map((product) => product.size).filter(Boolean))) as string[]
  };
}

export async function getJourneyScenes(): Promise<JourneySceneView[]> {
  if (!hasDatabaseUrl()) return demoJourneyScenes;

  try {
    const scenes = await prisma.journeyScene.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" }
    });

    return scenes.length
      ? scenes.map((scene) => ({
          id: scene.id,
          slug: scene.slug,
          stepLabel: scene.stepLabel,
          eyebrow: scene.eyebrow,
          title: scene.title,
          body: scene.body,
          imageUrl: scene.imageUrl,
          accentColor: scene.accentColor
        }))
      : demoJourneyScenes;
  } catch (error) {
    console.warn("Falling back to demo journey scenes:", error);
    return demoJourneyScenes;
  }
}
