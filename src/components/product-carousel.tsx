"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/types";

export function ProductCarousel({ products }: { products: StoreProduct[] }) {
  return (
    <section className="relative overflow-hidden bg-parchment py-10 sm:py-14">
      <div className="container">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-600">Best sellers</p>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Oils ready for the table</h2>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/shop">
              Shop all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product, index) => (
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
