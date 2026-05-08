import type { JourneySceneView, StoreProduct } from "@/lib/types";

const productImage = (name: string) => `/products/${name}.svg`;

export const demoProducts: StoreProduct[] = [
  {
    id: "demo-koroneiki-evoo",
    externalId: "ariston-koroneiki-evoo",
    slug: "koroneiki-extra-virgin-olive-oil",
    title: "Koroneiki Extra Virgin Olive Oil",
    subtitle: "Messinia single-origin",
    description:
      "A peppery, fruit-forward extra virgin olive oil made from Koroneiki olives grown in Messinia, Greece. It is designed for finishing salads, grilled fish, roasted vegetables, and warm bread.",
    shortDescription: "Single-origin Koroneiki EVOO with green almond, artichoke, and a clean pepper finish.",
    category: "Extra Virgin Olive Oil",
    categorySlug: "extra-virgin-olive-oil",
    flavor: "Koroneiki",
    size: "500ml",
    tags: ["best seller", "single-origin", "finishing"],
    priceCents: 2800,
    compareAtCents: null,
    currency: "USD",
    image: productImage("koroneiki-evoo"),
    images: [{ url: productImage("koroneiki-evoo"), alt: "Koroneiki extra virgin olive oil bottle" }],
    isFeatured: true,
    featuredRank: 1,
    inventory: { quantity: 84, visible: true }
  },
  {
    id: "demo-lemon-infused",
    externalId: "ariston-lemon-infused",
    slug: "lemon-infused-olive-oil",
    title: "Lemon Infused Olive Oil",
    subtitle: "Bright citrus finish",
    description:
      "A clean citrus infusion for seafood, greens, baked chicken, cakes, and vinaigrettes. It keeps the texture of extra virgin olive oil while lifting dishes with lemon zest aromatics.",
    shortDescription: "Sunlit lemon zest over smooth extra virgin olive oil.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Lemon",
    size: "250ml",
    tags: ["citrus", "seafood", "salad"],
    priceCents: 2200,
    compareAtCents: 2600,
    currency: "USD",
    image: productImage("lemon-infused"),
    images: [{ url: productImage("lemon-infused"), alt: "Lemon infused olive oil bottle" }],
    isFeatured: true,
    featuredRank: 2,
    inventory: { quantity: 52, visible: true }
  },
  {
    id: "demo-garlic-infused",
    externalId: "ariston-garlic-infused",
    slug: "garlic-infused-olive-oil",
    title: "Garlic Infused Olive Oil",
    subtitle: "Savory kitchen staple",
    description:
      "An aromatic garlic oil for roasted potatoes, focaccia, marinades, sauteed greens, and finishing soups. Bold enough for weeknight cooking and refined enough for a tasting board.",
    shortDescription: "Savory garlic aroma with a mellow extra virgin base.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Garlic",
    size: "250ml",
    tags: ["best seller", "savory", "roasting"],
    priceCents: 2200,
    compareAtCents: null,
    currency: "USD",
    image: productImage("garlic-infused"),
    images: [{ url: productImage("garlic-infused"), alt: "Garlic infused olive oil bottle" }],
    isFeatured: true,
    featuredRank: 3,
    inventory: { quantity: 63, visible: true }
  },
  {
    id: "demo-basil-infused",
    externalId: "ariston-basil-infused",
    slug: "basil-infused-olive-oil",
    title: "Basil Infused Olive Oil",
    subtitle: "Garden herb aroma",
    description:
      "Fresh basil character layered over silky olive oil. Built for tomatoes, mozzarella, grilled vegetables, pesto-style dressings, and pasta straight from the pan.",
    shortDescription: "Fresh basil fragrance for caprese, pasta, and grilled vegetables.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Basil",
    size: "250ml",
    tags: ["herb", "pasta", "caprese"],
    priceCents: 2200,
    compareAtCents: null,
    currency: "USD",
    image: productImage("basil-infused"),
    images: [{ url: productImage("basil-infused"), alt: "Basil infused olive oil bottle" }],
    isFeatured: false,
    featuredRank: 4,
    inventory: { quantity: 41, visible: true }
  },
  {
    id: "demo-rosemary-infused",
    externalId: "ariston-rosemary-infused",
    slug: "rosemary-infused-olive-oil",
    title: "Rosemary Infused Olive Oil",
    subtitle: "Woodsy and aromatic",
    description:
      "Rosemary-infused olive oil with a woodsy finish for lamb, potatoes, flatbread, beans, and roasted root vegetables.",
    shortDescription: "Woodsy rosemary infusion for roasted dishes and bread.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Rosemary",
    size: "250ml",
    tags: ["herb", "roasting", "bread"],
    priceCents: 2200,
    compareAtCents: null,
    currency: "USD",
    image: productImage("rosemary-infused"),
    images: [{ url: productImage("rosemary-infused"), alt: "Rosemary infused olive oil bottle" }],
    isFeatured: false,
    featuredRank: 5,
    inventory: { quantity: 38, visible: true }
  },
  {
    id: "demo-chili-infused",
    externalId: "ariston-chili-infused",
    slug: "chili-infused-olive-oil",
    title: "Chili Infused Olive Oil",
    subtitle: "Slow-building heat",
    description:
      "A balanced chili infusion for pizza, charred vegetables, eggs, soups, and grilled meats. The heat is present but clean, finishing with olive fruit.",
    shortDescription: "A smooth olive oil with a warm chili finish.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Chili",
    size: "250ml",
    tags: ["spicy", "pizza", "grill"],
    priceCents: 2200,
    compareAtCents: null,
    currency: "USD",
    image: productImage("chili-infused"),
    images: [{ url: productImage("chili-infused"), alt: "Chili infused olive oil bottle" }],
    isFeatured: false,
    featuredRank: 6,
    inventory: { quantity: 45, visible: true }
  },
  {
    id: "demo-truffle-infused",
    externalId: "ariston-truffle-infused",
    slug: "truffle-infused-olive-oil",
    title: "Truffle Infused Olive Oil",
    subtitle: "Earthy finishing oil",
    description:
      "An elegant truffle infusion for risotto, fries, eggs, mushrooms, and cheese boards. Designed as a finishing accent rather than a heavy cooking oil.",
    shortDescription: "Earthy truffle aroma for risotto, eggs, and cheese.",
    category: "Infused Olive Oil",
    categorySlug: "infused-olive-oil",
    flavor: "Truffle",
    size: "250ml",
    tags: ["premium", "finishing", "cheese"],
    priceCents: 3000,
    compareAtCents: 3400,
    currency: "USD",
    image: productImage("truffle-infused"),
    images: [{ url: productImage("truffle-infused"), alt: "Truffle infused olive oil bottle" }],
    isFeatured: true,
    featuredRank: 4,
    inventory: { quantity: 24, visible: true }
  },
  {
    id: "demo-greek-table-bundle",
    externalId: "ariston-greek-table-bundle",
    slug: "greek-table-bundle",
    title: "Greek Table Bundle",
    subtitle: "Three-bottle tasting set",
    description:
      "A curated tasting bundle with Koroneiki EVOO, lemon infusion, and garlic infusion. Made for grazing boards, weekday cooking, and gifting.",
    shortDescription: "Koroneiki, lemon, and garlic oils in a giftable tasting set.",
    category: "Bundles",
    categorySlug: "bundles",
    flavor: "Mixed",
    size: "3 x 250ml",
    tags: ["bundle", "gift", "pairing"],
    priceCents: 6400,
    compareAtCents: 7200,
    currency: "USD",
    image: productImage("greek-table-bundle"),
    images: [{ url: productImage("greek-table-bundle"), alt: "Greek Table olive oil bundle" }],
    isFeatured: true,
    featuredRank: 5,
    inventory: { quantity: 31, visible: true }
  }
];

export const demoJourneyScenes: JourneySceneView[] = [
  {
    id: "scene-groves",
    slug: "messinia-groves",
    stepLabel: "01",
    eyebrow: "Messinia",
    title: "Groves shaped by sea air and limestone light",
    body:
      "Koroneiki olives begin in sun-warmed Greek groves where dry breezes, mineral soil, and careful pruning build the fruit's peppery character.",
    imageUrl: "/journey/groves.mp4",
    accentColor: "#c8a85a"
  },
  {
    id: "scene-olives",
    slug: "koroneiki-fruit",
    stepLabel: "02",
    eyebrow: "Koroneiki",
    title: "Small olives, concentrated aroma",
    body:
      "Koroneiki fruit is compact and intensely aromatic, prized for green almond notes, grassy freshness, and a clean, lingering finish.",
    imageUrl: "/journey/olives.mp4",
    accentColor: "#68753c"
  },
  {
    id: "scene-press",
    slug: "cold-press",
    stepLabel: "04",
    eyebrow: "Cold press",
    title: "Crushed without chemical refining",
    body:
      "Extra virgin oil is extracted by crushing olives and separating the oil without chemical refining, protecting texture, taste, and fragrance.",
    imageUrl: "/journey/press.mp4",
    accentColor: "#30401f"
  },
  {
    id: "scene-infusion",
    slug: "infusion",
    stepLabel: "05",
    eyebrow: "Infusion",
    title: "Herbs, citrus, garlic, basil, rosemary, and chili",
    body:
      "Infusions are blended for balance: vivid enough to transform a dish, restrained enough to let the olive oil remain the center.",
    imageUrl: "/journey/infusion.mp4",
    accentColor: "#98752f"
  },
  {
    id: "scene-bottle",
    slug: "bottling",
    stepLabel: "06",
    eyebrow: "Bottle",
    title: "Protected from light, labeled with restraint",
    body:
      "Dark glass, clean labels, and small-batch control preserve the oil from press to pantry while keeping the shelf presence quiet and premium.",
    imageUrl: "/journey/bottle.svg",
    accentColor: "#172214"
  },
  {
    id: "scene-table",
    slug: "table",
    stepLabel: "07",
    eyebrow: "Table",
    title: "Bread, salad, fish, pasta, and cheese",
    body:
      "Every bottle is made to finish real food: a ribbon over grilled fish, a pool for bread, a citrus lift for salad, or a herb note over pasta.",
    imageUrl: "/journey/table.svg",
    accentColor: "#d7c6aa"
  }
];

export const pairings = [
  {
    oil: "Lemon Infused",
    food: "Fish, greens, roasted chicken",
    note: "Brightens delicate proteins without adding heaviness."
  },
  {
    oil: "Garlic Infused",
    food: "Focaccia, potatoes, beans",
    note: "A savory shortcut with clean extra virgin structure."
  },
  {
    oil: "Basil Infused",
    food: "Tomatoes, mozzarella, pasta",
    note: "Garden-fresh aroma for warm and cold dishes."
  },
  {
    oil: "Truffle Infused",
    food: "Eggs, mushrooms, cheese",
    note: "A final flourish for earthy, creamy plates."
  }
];
