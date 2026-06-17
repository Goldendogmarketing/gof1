"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/types";

export function ProductCarousel({ products }: { products: StoreProduct[] }) {
  if (!products.length) return null;

  const count = Math.min(products.length, 4);
  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : count === 3
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-4";
  const containerClass = count < 4 ? "mx-auto max-w-4xl" : "";

  return (
    <section className="relative overflow-hidden bg-parchment py-10 sm:py-14">
      <div className="container">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-accessible">Featured</p>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Oils ready for the table</h2>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/shop">
              Shop all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className={`grid gap-4 ${gridClass} ${containerClass}`}>
          {products.slice(0, 4).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              viewport={{ once: true, margin: "-80px" }}
            >
              <ProductCard product={product} priority={index < 2} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
