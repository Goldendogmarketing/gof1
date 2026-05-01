import { NextResponse } from "next/server";
import { syncProductFeed } from "@/lib/product-feed";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncProductFeed("vercel-cron");
  return NextResponse.json(result);
}
