import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { syncProductFeed } from "@/lib/product-feed";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session) && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncProductFeed("manual");
  return NextResponse.json(result);
}
