import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { productFormSchema } from "@/lib/validations";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { getProducts } from "@/lib/products";

async function canAdmin() {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) || process.env.NODE_ENV === "development";
}

export async function GET() {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ products: await getProducts() });
}

export async function POST(request: Request) {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "DATABASE_URL is required to create products." }, { status: 400 });

  const parsed = productFormSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });

  const input = parsed.data;
  const category = await prisma.productCategory.upsert({
    where: { slug: input.categorySlug },
    update: { name: input.categoryName },
    create: { slug: input.categorySlug, name: input.categoryName }
  });

  const product = await prisma.product.create({
    data: {
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      priceCents: input.priceCents,
      compareAtCents: input.compareAtCents ?? null,
      categoryId: category.id,
      flavor: input.flavor,
      size: input.size,
      isFeatured: input.isFeatured ?? false,
      status: "ACTIVE",
      publishedAt: new Date(),
      images: {
        create: {
          url: input.imageUrl,
          alt: input.title,
          isPrimary: true
        }
      },
      inventory: {
        create: {
          quantity: input.inventoryQuantity,
          visible: true
        }
      }
    }
  });

  return NextResponse.json({ product });
}
