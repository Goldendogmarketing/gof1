export type Money = {
  cents: number;
  currency: string;
};

export type StoreProduct = {
  id: string;
  externalId?: string | null;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  shortDescription: string;
  category: string;
  categorySlug: string;
  flavor?: string | null;
  size?: string | null;
  tags: string[];
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  image: string;
  images: Array<{ url: string; alt: string }>;
  isFeatured: boolean;
  featuredRank: number;
  inventory: {
    quantity: number;
    visible: boolean;
  };
};

export type JourneySceneView = {
  id: string;
  slug: string;
  stepLabel: string;
  eyebrow?: string | null;
  title: string;
  body: string;
  imageUrl?: string | null;
  accentColor?: string | null;
};

export type CartLine = {
  product: StoreProduct;
  quantity: number;
};
