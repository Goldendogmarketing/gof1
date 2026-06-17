import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { ProductVariants } from "@/components/product-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decodeEntities } from "@/lib/decode-entities";
import { formatMoney } from "@/lib/format";
import { getProductBySlug, getProducts, getProductSiblings } from "@/lib/products";
import { getProductReviews } from "@/lib/reviews";

// Product detail pages self-refresh once a minute so price edits and feed
// syncs propagate without us having to revalidate by hand.
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.greekolivefusion.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  // Title is already cleaned at the data layer (no `Code#NNN`). Descriptions can
  // arrive double-encoded (`&amp;#8230;`), so decode them into real characters.
  const title = product.title;
  const description = decodeEntities(product.shortDescription || product.description);

  return {
    title,
    description,
    alternates: {
      canonical: `/shop/${product.slug}`
    },
    openGraph: {
      title,
      description,
      images: [product.image]
    }
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

// Only render a spec row when it carries a real value (fixes the empty "Size").
function Spec({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="block font-semibold uppercase text-olive-700">{label}</span>
      {value}
    </div>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const siblings = await getProductSiblings(product.slug);
  // Seeded, read-only reviews (synchronous) — see src/lib/reviews.ts.
  const reviews = getProductReviews(product.slug);

  const inStock = product.inventory.quantity > 0;
  const description = decodeEntities(product.shortDescription || product.description);
  const productUrl = `${SITE_URL}/shop/${product.slug}`;
  const absoluteImage = product.image.startsWith("http") ? product.image : `${SITE_URL}${product.image}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [absoluteImage],
    description,
    sku: product.externalId ?? product.id,
    brand: { "@type": "Brand", name: "Greek Olive Fusion" },
    ...(reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average,
            reviewCount: reviews.count
          }
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.category ? [{ label: product.category, href: `/shop?category=${product.categorySlug}` }] : []),
    { label: product.title }
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {})
    }))
  };

  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />

        <Button asChild variant="ghost" className="mb-6">
          <Link href="/shop">
            <ArrowLeft className="size-4" />
            Back to shop
          </Link>
        </Button>

        <section className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
          <ProductGallery
            images={product.images}
            fallbackImage={product.image}
            productTitle={product.title}
          />

          <div className="grid content-center gap-8">
            <div className="space-y-4">
              <Badge>{product.category}</Badge>
              <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">{product.title}</h1>
              <p className="text-lg leading-8 text-ink/70">{decodeEntities(product.description)}</p>
            </div>

            {/* Variant selector replaces the old static Size/Flavor labels. Renders
                nothing when no sibling variants are detected. */}
            <ProductVariants variants={siblings} label="Size" />

            <div className="grid gap-4 border-y border-olive-900/10 py-6 text-sm text-ink/70 sm:grid-cols-3">
              <Spec label="Flavor" value={product.flavor} />
              <Spec label="Size" value={product.size} />
              <div>
                <span className="block font-semibold uppercase text-olive-700">Inventory</span>
                {inStock ? "In stock" : "Back soon"}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-display text-4xl text-olive-900">
                  {formatMoney(product.priceCents, product.currency)}
                </span>
                {product.compareAtCents ? (
                  <span className="ml-3 text-lg text-ink/45 line-through">
                    {formatMoney(product.compareAtCents, product.currency)}
                  </span>
                ) : null}
              </div>
              <AddToCart product={product} />
            </div>

            {/* Trust / reassurance block — static copy. */}
            <ul className="grid gap-3 rounded-md border border-olive-900/10 bg-white/55 p-4 text-sm text-ink/75 shadow-soft sm:grid-cols-3">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-olive-700" />
                <span>Free shipping on orders over $85</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-olive-700" />
                <span>Satisfaction &amp; damage-replacement guarantee</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-olive-700" />
                <span>Typically ships in 2–4 business days</span>
              </li>
            </ul>
          </div>
        </section>

        {reviews.count > 0 ? (
          <div className="mt-16">
            <ProductReviews summary={reviews} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
