import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdminSession } from "@/lib/auth";
import { priceOverrideSchema, productFormSchema } from "@/lib/validations";
import { prisma, hasDatabaseUrl } from "@/lib/db";

async function canAdmin() {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) || process.env.NODE_ENV === "development";
}

// Accept either a full product-form payload (existing behavior) or a small
// `{ action: "override" | "reset", ... }` payload from the inline price editor.
const patchBodySchema = z.union([priceOverrideSchema, productFormSchema.partial()]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "DATABASE_URL is required to update products." }, { status: 400 });

  const parsed = patchBodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });

  const { id } = await params;
  const body = parsed.data;

  // --- Price-override quick-path (from the inline admin price editor) -----
  if ("action" in body) {
    if (body.action === "reset") {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { feedPriceCents: true, feedCompareAtCents: true, priceCents: true, compareAtCents: true }
      });
      if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

      const product = await prisma.product.update({
        where: { id },
        data: {
          priceOverridden: false,
          // Snap back to the most recent feed price if we have one.
          priceCents: existing.feedPriceCents ?? existing.priceCents,
          compareAtCents: existing.feedCompareAtCents ?? existing.compareAtCents
        }
      });
      return NextResponse.json({ product });
    }

    // action === "override"
    const product = await prisma.product.update({
      where: { id },
      data: {
        priceOverridden: true,
        priceCents: body.priceCents,
        // Only touch compareAt when the caller actually sent a value (including null to clear it).
        ...(body.compareAtCents !== undefined ? { compareAtCents: body.compareAtCents } : {})
      }
    });
    return NextResponse.json({ product });
  }

  // --- Existing full-form edit path ---------------------------------------
  const input = body;
  const category =
    input.categorySlug && input.categoryName
      ? await prisma.productCategory.upsert({
          where: { slug: input.categorySlug },
          update: { name: input.categoryName },
          create: { slug: input.categorySlug, name: input.categoryName }
        })
      : null;

  // If the caller is editing the price through the full form, treat that as an override too.
  const priceTouched = input.priceCents !== undefined || input.compareAtCents !== undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      priceCents: input.priceCents,
      compareAtCents: input.compareAtCents,
      ...(priceTouched ? { priceOverridden: true } : {}),
      categoryId: category?.id,
      flavor: input.flavor,
      size: input.size,
      isFeatured: input.isFeatured
    }
  });

  if (input.imageUrl) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: input.imageUrl,
        alt: product.title,
        isPrimary: true
      }
    });
  }

  if (input.inventoryQuantity !== undefined) {
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { quantity: input.inventoryQuantity },
      create: { productId: product.id, quantity: input.inventoryQuantity, visible: true }
    });
  }

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "DATABASE_URL is required to archive products." }, { status: 400 });

  const { id } = await params;
  const product = await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", publishedAt: null }
  });

  return NextResponse.json({ product });
}
