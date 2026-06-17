import { NextResponse } from "next/server";
import { syncProductFeed } from "@/lib/product-feed";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  // Fail-closed in production: a missing CRON_SECRET would otherwise leave this
  // endpoint open to unauthenticated callers. Refuse to run rather than sync
  // the product feed for anyone who can reach the URL.
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error("Product-sync cron rejected: CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncProductFeed("vercel-cron");
  return NextResponse.json(result);
}
