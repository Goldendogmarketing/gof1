import { z } from "zod";
import { slugify } from "@/lib/format";
import type { ExternalProduct, ProductFeedAdapter, ProductFeedFetchOptions } from "@/lib/product-feed/types";

const wooImageSchema = z.object({
  src: z.string().url().optional(),
  alt: z.string().optional()
});

const wooCategorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional()
});

const wooAttributeSchema = z.object({
  name: z.string().optional(),
  options: z.array(z.string()).optional()
});

const wooProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional(),
  regular_price: z.string().optional(),
  sale_price: z.string().optional(),
  manage_stock: z.boolean().optional(),
  stock_quantity: z.number().nullable().optional(),
  stock_status: z.string().optional(),
  categories: z.array(wooCategorySchema).optional(),
  images: z.array(wooImageSchema).optional(),
  attributes: z.array(wooAttributeSchema).optional()
});

function stripHtml(value?: string) {
  return (value ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#038;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cents(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function attribute(productAttributes: Array<z.infer<typeof wooAttributeSchema>>, names: string[]) {
  const found = productAttributes.find((item) => {
    const name = item.name?.toLowerCase() ?? "";
    return names.some((candidate) => name.includes(candidate));
  });

  return found?.options?.[0];
}

function buildEndpoint() {
  const baseUrl = process.env.WOOCOMMERCE_STORE_URL ?? process.env.PRODUCT_FEED_URL;
  if (!baseUrl) {
    throw new Error("WOOCOMMERCE_STORE_URL or PRODUCT_FEED_URL is required for the WooCommerce adapter.");
  }

  const url = new URL(baseUrl);
  if (!url.pathname.includes("/wp-json/wc/")) {
    url.pathname = "/wp-json/wc/v3/products";
  }
  url.searchParams.set("per_page", "100");
  url.searchParams.set("status", "publish");
  return url;
}

function authHeader() {
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error("WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET are required.");
  }

  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

async function fetchPage(page: number, options?: ProductFeedFetchOptions) {
  const url = buildEndpoint();
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader()
    },
    ...(options?.cache === "no-store" ? { cache: "no-store" as const } : { next: { revalidate: 300 } })
  });

  if (!response.ok) {
    throw new Error(`WooCommerce product feed failed with ${response.status}.`);
  }

  const totalPages = Number(response.headers.get("x-wp-totalpages") ?? "1");
  return {
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    products: z.array(wooProductSchema).parse(await response.json())
  };
}

export function woocommerceProductFeedAdapter(): ProductFeedAdapter {
  return {
    name: "woocommerce",
    async fetchProducts(options?: ProductFeedFetchOptions): Promise<ExternalProduct[]> {
      const firstPage = await fetchPage(1, options);
      const pages = [firstPage.products];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        pages.push((await fetchPage(page, options)).products);
      }

      return pages.flat().map((product) => {
        const category = product.categories?.[0];
        const attributes = product.attributes ?? [];
        const priceCents = cents(product.sale_price) ?? cents(product.price) ?? cents(product.regular_price) ?? 0;
        const regularCents = cents(product.regular_price);
        const compareAtCents = regularCents && regularCents > priceCents ? regularCents : null;
        const cleanDescription = stripHtml(product.description);
        const cleanShortDescription = stripHtml(product.short_description);

        return {
          externalId: `woocommerce-${product.id}`,
          title: product.name,
          slug: product.slug || slugify(product.name),
          description: cleanDescription || cleanShortDescription,
          shortDescription: cleanShortDescription || cleanDescription.slice(0, 180),
          category: category?.name ?? "Olive Oil",
          categorySlug: category?.slug ?? slugify(category?.name ?? "Olive Oil"),
          flavor: attribute(attributes, ["flavor", "infusion", "variety"]),
          size: attribute(attributes, ["size", "volume", "bottle"]),
          sku: product.sku || undefined,
          priceCents,
          compareAtCents,
          currency: "USD",
          inventoryQuantity:
            product.stock_quantity ?? (product.stock_status === "instock" || product.manage_stock === false ? 999 : 0),
          imageUrls: product.images?.map((image) => image.src).filter(Boolean) as string[] | undefined,
          tags: [product.featured ? "featured" : "", category?.name ?? ""].filter(Boolean),
          isPublished: product.status === "publish"
        };
      });
    }
  };
}
