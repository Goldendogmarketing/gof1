import { NextResponse } from "next/server";
import { createCloverHostedCheckout, hasCloverConfig } from "@/lib/clover";
import { orderNumber } from "@/lib/format";
import { prisma, hasDatabaseUrl } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A hidden, self-contained $1 live-payment test. Creates a real Clover Hosted
// Checkout for $1.00 with no shipping so we can confirm money lands in the
// merchant's Clover account and the webhook -> PAID -> email path runs end to
// end. The order number is prefixed "TEST-" so the Clover webhook skips the
// Ariston drop-ship email (see src/app/api/clover/webhook/route.ts).

const TEST_PRICE_CENTS = 100; // $1.00
const TEST_ITEM_NAME = "GOF Live Payment Test ($1 — DO NOT FULFILL)";

function absoluteUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path}`;
}

export async function POST(request: Request) {
  if (!hasCloverConfig()) {
    return NextResponse.json({ error: "Clover is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim()
      : process.env.OWNER_NOTIFICATION_EMAIL || "orders@greekolivefusion.com";

  // Prefix marks this as a test so the webhook skips the drop-ship email.
  const number = `TEST-${orderNumber()}`;

  // A fixed ship-to (the store's own address) keeps the receipt/owner emails
  // well-formed without collecting a real customer address for a test.
  const shippingAddress = {
    firstName: "GOF",
    lastName: "Live Test",
    addressLine1: "8320 Singleton Pl",
    city: "Keystone Heights",
    state: "FL",
    zip: "32656",
    phone: "(772) 528-5208"
  };

  let dbOrderId: string | null = null;
  if (hasDatabaseUrl()) {
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: number,
          email,
          status: "PENDING",
          subtotalCents: TEST_PRICE_CENTS,
          discountCents: 0,
          shippingCents: 0,
          taxCents: 0,
          totalCents: TEST_PRICE_CENTS,
          shippingAddress,
          items: {
            create: [
              {
                productId: "test-dollar",
                title: TEST_ITEM_NAME,
                quantity: 1,
                unitPriceCents: TEST_PRICE_CENTS,
                totalCents: TEST_PRICE_CENTS
              }
            ]
          }
        }
      });
      dbOrderId = order.id;
    } catch (error) {
      console.warn("test-purchase: could not persist order:", error);
    }
  }

  try {
    const checkout = await createCloverHostedCheckout({
      email,
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      phoneNumber: shippingAddress.phone,
      lineItems: [{ name: TEST_ITEM_NAME, priceCents: TEST_PRICE_CENTS, unitQty: 1 }],
      redirectUrl: absoluteUrl(
        `/order-confirmation?orderNumber=${encodeURIComponent(number)}${dbOrderId ? `&orderId=${encodeURIComponent(dbOrderId)}` : ""}`
      ),
      pageConfigUuid: process.env.CLOVER_PAGE_CONFIG_UUID || undefined
    });

    if (dbOrderId) {
      try {
        await prisma.order.update({
          where: { id: dbOrderId },
          data: { stripeCheckoutSessionId: checkout.checkoutSessionId }
        });
      } catch {
        // non-fatal — webhook retries until the session id is stored.
      }
    }

    return NextResponse.json({ url: checkout.href, orderNumber: number });
  } catch (error) {
    console.error("test-purchase: Clover checkout creation failed:", error);
    return NextResponse.json({ error: "Could not start the Clover test checkout." }, { status: 500 });
  }
}
