"use client";

import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StoreProduct } from "@/lib/types";

type Facets = {
  categories: Array<{ slug: string; name: string }>;
  flavors: string[];
  sizes: string[];
};

export function ShopClient({ products, facets }: { products: StoreProduct[]; facets: Facets }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [flavor, setFlavor] = React.useState("all");
  const [size, setSize] = React.useState("all");
  const [price, setPrice] = React.useState("all");
  const [sort, setSort] = React.useState("featured");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesQuery =
          !q ||
          [product.title, product.shortDescription, product.category, product.flavor, product.tags.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchesCategory = category === "all" || product.categorySlug === category;
        const matchesFlavor = flavor === "all" || product.flavor === flavor;
        const matchesSize = size === "all" || product.size === size;
        const matchesPrice =
          price === "all" ||
          (price === "under-25" && product.priceCents < 2500) ||
          (price === "25-50" && product.priceCents >= 2500 && product.priceCents <= 5000) ||
          (price === "50-plus" && product.priceCents > 5000);

        return matchesQuery && matchesCategory && matchesFlavor && matchesSize && matchesPrice;
      })
      .sort((a, b) => {
        if (sort === "price-asc") return a.priceCents - b.priceCents;
        if (sort === "price-desc") return b.priceCents - a.priceCents;
        if (sort === "best-sellers") return Number(b.tags.includes("best seller")) - Number(a.tags.includes("best seller"));
        if (sort === "bundles") return Number(b.categorySlug === "bundles") - Number(a.categorySlug === "bundles");
        return Number(b.isFeatured) - Number(a.isFeatured) || a.featuredRank - b.featuredRank;
      });
  }, [category, flavor, price, products, query, size, sort]);

  return (
    <div className="container py-12">
      <div className="mb-8 grid gap-4 rounded-md border border-olive-900/10 bg-white/55 p-4 shadow-soft lg:grid-cols-[1.4fr_repeat(5,1fr)]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-olive-700" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search olive oils"
            className="pl-10"
            aria-label="Search products"
          />
        </label>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {facets.categories.map((facet) => (
            <option key={facet.slug} value={facet.slug}>
              {facet.name}
            </option>
          ))}
        </Select>
        <Select value={flavor} onChange={(event) => setFlavor(event.target.value)} aria-label="Filter by flavor">
          <option value="all">All flavors</option>
          {facets.flavors.map((facet) => (
            <option key={facet} value={facet}>
              {facet}
            </option>
          ))}
        </Select>
        <Select value={size} onChange={(event) => setSize(event.target.value)} aria-label="Filter by size">
          <option value="all">All sizes</option>
          {facets.sizes.map((facet) => (
            <option key={facet} value={facet}>
              {facet}
            </option>
          ))}
        </Select>
        <Select value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Filter by price">
          <option value="all">All prices</option>
          <option value="under-25">Under $25</option>
          <option value="25-50">$25 to $50</option>
          <option value="50-plus">$50+</option>
        </Select>
        <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="best-sellers">Best sellers</option>
          <option value="bundles">Bundles first</option>
          <option value="price-asc">Price low to high</option>
          <option value="price-desc">Price high to low</option>
        </Select>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 text-sm text-ink/60">
        <span>{filtered.length} products</span>
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>
    </div>
  );
}
