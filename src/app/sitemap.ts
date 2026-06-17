import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.greekolivefusion.com";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pairings", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/shipping", changeFrequency: "yearly", priority: 0.3 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.3 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  try {
    const products = await getProducts();
    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${SITE_URL}/shop/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    console.warn("Falling back to static sitemap after product lookup failure:", error);
    return staticEntries;
  }
}
