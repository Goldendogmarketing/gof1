import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";
  const products = await getProducts();

  return NextResponse.json({
    products: featured ? products.filter((product) => product.isFeatured) : products
  });
}
