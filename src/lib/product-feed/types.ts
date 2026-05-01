export type ExternalProduct = {
  externalId: string;
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  categorySlug?: string;
  flavor?: string;
  size?: string;
  sku?: string;
  priceCents: number;
  compareAtCents?: number | null;
  currency?: string;
  inventoryQuantity?: number;
  imageUrls?: string[];
  tags?: string[];
  isPublished?: boolean;
};

export type NormalizedProduct = {
  externalId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryName: string;
  categorySlug: string;
  flavor?: string;
  size?: string;
  sku?: string;
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  inventoryQuantity: number;
  imageUrls: string[];
  tags: string[];
  isPublished: boolean;
};

export type ProductFeedFetchOptions = {
  cache?: "default" | "no-store";
};

export interface ProductFeedAdapter {
  name: string;
  fetchProducts(options?: ProductFeedFetchOptions): Promise<ExternalProduct[]>;
}
