import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { getProductBySlug, getProducts } from "@/lib/products";

// Product detail pages self-refresh once a minute so price edits and feed
// syncs propagate without us having to revalidate by hand.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: {
      images: [product.image]
    }
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <div className="container py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/shop">
            <ArrowLeft className="size-4" />
            Back to shop
          </Link>
        </Button>

        <section className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-cream shadow-soft">
            <Image
              src={product.image}
              alt={product.images[0]?.alt ?? product.title}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="grid content-center gap-8">
            <div className="space-y-4">
              <Badge>{product.category}</Badge>
              <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">{product.title}</h1>
              <p className="text-lg leading-8 text-ink/70">{product.description}</p>
            </div>

            <div className="grid gap-4 border-y border-olive-900/10 py-6 text-sm text-ink/70 sm:grid-cols-3">
              <div>
                <span className="block font-semibold uppercase text-olive-700">Flavor</span>
                {product.flavor}
              </div>
              <div>
                <span className="block font-semibold uppercase text-olive-700">Size</span>
                {product.size}
              </div>
              <div>
                <span className="block font-semibold uppercase text-olive-700">Inventory</span>
                {product.inventory.quantity > 0 ? "In stock" : "Back soon"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="mr-auto">
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
          </div>
        </section>
      </div>
    </main>
  );
}
