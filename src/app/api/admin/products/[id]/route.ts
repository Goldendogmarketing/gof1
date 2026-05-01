import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { productFormSchema } from "@/lib/validations";
import { prisma, hasDatabaseUrl } from "@/lib/db";

async function canAdmin() {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) || process.env.NODE_ENV === "development";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "DATABASE_URL is required to update products." }, { status: 400 });

  const parsed = productFormSchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });

  const { id } = await params;
  const input = parsed.data;
  const category =
    input.categorySlug && input.categoryName
      ? await prisma.productCategory.upsert({
          where: { slug: input.categorySlug },
          update: { name: input.categoryName },
          create: { slug: input.categorySlug, name: input.categoryName }
        })
      : null;

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      priceCents: input.priceCents,
      compareAtCents: input.compareAtCents,
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
