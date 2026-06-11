import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { getProductFeedAdapter } from "@/lib/product-feed/adapter";
import { normalizeExternalProduct } from "@/lib/product-feed/normalize";
import { syncProductFeed } from "@/lib/product-feed";
import { hasDatabaseUrl, prisma } from "@/lib/db";

async function canAdmin() {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) || process.env.NODE_ENV === "development";
}

export async function POST() {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncProductFeed("manual");

  // Bust the ISR cache for the pages that read getProducts() so a fresh sync
  // is visible immediately instead of waiting on the revalidate window.
  for (const path of ["/", "/shop", "/admin/products"]) {
    try {
      revalidatePath(path);
    } catch {
      // Best-effort — never let a cache-bust failure mask the sync result.
    }
  }
  // Product detail pages share a single dynamic segment — clear the whole layout.
  try {
    revalidatePath("/shop/[slug]", "page");
  } catch {
    // ignore
  }

  return NextResponse.json(result);
}

/**
 * GET /api/admin/feed-sync
 * Dry-run diagnostic: fetches from the live WooCommerce feed without writing to
 * the DB, and reports how many products came back, what statuses they have, and
 * how many were dropped by each filter. Use this when the catalog looks short.
 *
 * Also returns the last 3 sync log entries from ApiSyncLog so we can see whether
 * past syncs actually wrote everything.
 */
export async function GET() {
  if (!(await canAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adapter = getProductFeedAdapter();

  let external: Awaited<ReturnType<typeof adapter.fetchProducts>> = [];
  let adapterError: string | null = null;

  try {
    external = await adapter.fetchProducts({ cache: "no-store" });
  } catch (err) {
    adapterError = err instanceof Error ? err.message : String(err);
  }

  const normalized = external.map(normalizeExternalProduct);

  // Bucket products by why they'd be dropped from the live-feed storefront fallback.
  const filterReasons: Record<string, number> = {
    kept: 0,
    notPublished: 0,
    zeroPrice: 0
  };
  for (const product of normalized) {
    if (!product.isPublished) {
      filterReasons.notPublished += 1;
    } else if (product.priceCents <= 0) {
      filterReasons.zeroPrice += 1;
    } else {
      filterReasons.kept += 1;
    }
  }

  // What sync.ts would actually write to the DB (ACTIVE vs DRAFT).
  const syncStatusBreakdown = normalized.reduce(
    (acc, p) => {
      if (p.isPublished) acc.ACTIVE += 1;
      else acc.DRAFT += 1;
      return acc;
    },
    { ACTIVE: 0, DRAFT: 0 }
  );

  // DB snapshot: current row counts by status.
  let dbBreakdown: { ACTIVE: number; DRAFT: number; ARCHIVED: number } | null = null;
  let recentSyncs: Array<{
    startedAt: Date;
    status: string;
    productsSeen: number;
    productsUpserted: number;
    message: string | null;
  }> = [];

  if (hasDatabaseUrl()) {
    try {
      const [active, draft, archived, logs] = await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.product.count({ where: { status: "DRAFT" } }),
        prisma.product.count({ where: { status: "ARCHIVED" } }),
        prisma.apiSyncLog.findMany({
          orderBy: { startedAt: "desc" },
          take: 5,
          select: {
            startedAt: true,
            status: true,
            productsSeen: true,
            productsUpserted: true,
            message: true
          }
        })
      ]);
      dbBreakdown = { ACTIVE: active, DRAFT: draft, ARCHIVED: archived };
      recentSyncs = logs;
    } catch (err) {
      console.warn("feed-sync diagnostic: db read failed", err);
    }
  }

  return NextResponse.json({
    adapter: adapter.name,
    adapterError,
    feed: {
      totalReturned: external.length,
      afterNormalization: normalized.length,
      storefrontFilter: filterReasons,
      syncStatusBreakdown,
      sampleTitles: normalized.slice(0, 10).map((p) => ({
        title: p.title,
        slug: p.slug,
        priceCents: p.priceCents,
        isPublished: p.isPublished,
        category: p.categoryName
      }))
    },
    db: dbBreakdown,
    recentSyncs
  });
}
