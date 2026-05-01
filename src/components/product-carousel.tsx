"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/types";

export function ProductCarousel({ products }: { products: StoreProduct[] }) {
  return (
    <section className="relative overflow-hidden bg-parchment py-16 sm:py-20">
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Featured bottles</p>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">Oils ready for the table</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/shop">
              Shop all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-[max(1.25rem,calc((100vw-1340px)/2+1.25rem))] pb-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            className="w-[82vw] shrink-0 snap-start sm:w-[47vw] lg:w-[31vw] xl:w-[24vw]"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: index * 0.06 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <ProductCard product={product} priority={index < 2} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
