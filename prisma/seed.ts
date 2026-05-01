import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { demoJourneyScenes, demoProducts } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "owner@greekolivefusion.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-before-launch";

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      role: "ADMIN",
      name: "Greek Olive Fusion Owner"
    },
    create: {
      email: adminEmail.toLowerCase(),
      name: "Greek Olive Fusion Owner",
      role: "ADMIN",
      passwordHash: await hash(adminPassword, 12)
    }
  });

  for (const product of demoProducts) {
    const category = await prisma.productCategory.upsert({
      where: { slug: product.categorySlug },
      update: {
        name: product.category
      },
      create: {
        name: product.category,
        slug: product.categorySlug,
        description: `${product.category} curated for Greek Olive Fusion.`
      }
    });

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        externalId: product.externalId,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        shortDescription: product.shortDescription,
        priceCents: product.priceCents,
        compareAtCents: product.compareAtCents,
        currency: product.currency,
        flavor: product.flavor,
        size: product.size,
        tags: product.tags,
        isFeatured: product.isFeatured,
        featuredRank: product.featuredRank,
        status: "ACTIVE",
        publishedAt: new Date(),
        categoryId: category.id
      },
      create: {
        externalId: product.externalId,
        slug: product.slug,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        shortDescription: product.shortDescription,
        priceCents: product.priceCents,
        compareAtCents: product.compareAtCents,
        currency: product.currency,
        flavor: product.flavor,
        size: product.size,
        tags: product.tags,
        isFeatured: product.isFeatured,
        featuredRank: product.featuredRank,
        status: "ACTIVE",
        publishedAt: new Date(),
        categoryId: category.id
      }
    });

    await prisma.inventory.upsert({
      where: { productId: saved.id },
      update: {
        quantity: product.inventory.quantity,
        visible: product.inventory.visible
      },
      create: {
        productId: saved.id,
        quantity: product.inventory.quantity,
        visible: product.inventory.visible
      }
    });

    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: product.images.map((image, index) => ({
        productId: saved.id,
        url: image.url,
        alt: image.alt,
        sortOrder: index,
        isPrimary: index === 0
      }))
    });
  }

  for (const [index, scene] of demoJourneyScenes.entries()) {
    await prisma.journeyScene.upsert({
      where: { slug: scene.slug },
      update: {
        stepLabel: scene.stepLabel,
        eyebrow: scene.eyebrow,
        title: scene.title,
        body: scene.body,
        imageUrl: scene.imageUrl,
        accentColor: scene.accentColor,
        sortOrder: index,
        published: true
      },
      create: {
        slug: scene.slug,
        stepLabel: scene.stepLabel,
        eyebrow: scene.eyebrow,
        title: scene.title,
        body: scene.body,
        imageUrl: scene.imageUrl,
        accentColor: scene.accentColor,
        sortOrder: index,
        published: true
      }
    });
  }

  await prisma.discountCode.upsert({
    where: { code: "TABLE10" },
    update: {},
    create: {
      code: "TABLE10",
      type: "PERCENTAGE",
      value: 10,
      active: true,
      minimumSubtotalCents: 5000
    }
  });

  await prisma.homepageSection.upsert({
    where: { key: "heritage" },
    update: {
      title: "Four generations, one Mediterranean table",
      body:
        "Greek Olive Fusion carries forward Ariston-inspired values: traditional harvesting, modern technique, and a focus on taste, aroma, texture, and quality."
    },
    create: {
      key: "heritage",
      kind: "STORY",
      eyebrow: "Heritage",
      title: "Four generations, one Mediterranean table",
      body:
        "Greek Olive Fusion carries forward Ariston-inspired values: traditional harvesting, modern technique, and a focus on taste, aroma, texture, and quality.",
      sortOrder: 3
    }
  });

  await prisma.settings.upsert({
    where: { key: "storefront" },
    update: {},
    create: {
      key: "storefront",
      value: {
        announcement: "Free shipping on tasting bundles over $75",
        supportEmail: "hello@greekolivefusion.com",
        taxMode: "stripe_automatic_tax"
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
