import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations";
import { getProducts } from "@/lib/products";
import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { orderNumber } from "@/lib/format";
import { prisma, hasDatabaseUrl } from "@/lib/db";

function absoluteUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path}`;
}

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  }

  const { email, discountCode, items } = parsed.data;
  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const products = await getProducts();
  const lines = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId || candidate.slug === item.slug);
    if (!product) return null;
    return { product, quantity: item.quantity };
  });

  if (lines.some((line) => !line)) {
    return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });
  }

  const validLines = lines as Array<NonNullable<(typeof lines)[number]>>;
  const subtotalCents = validLines.reduce((total, line) => total + line.product.priceCents * line.quantity, 0);
  const hasDemoDiscount = discountCode?.toUpperCase() === "TABLE10" && subtotalCents >= 5000;
  const discountCents = hasDemoDiscount ? Math.round(subtotalCents * 0.1) : 0;
  const shippingCents = subtotalCents > 7500 ? 0 : 900;

  const square = getSquareClient();
  const locationId = getSquareLocationId();
  const number = orderNumber();

  let dbOrderId: string | null = null;
  if (hasDatabaseUrl()) {
    try {
      const customer = await prisma.customer.upsert({
        where: { email },
        update: {},
        create: { email }
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: number,
          email,
          customerId: customer.id,
          status: "PENDING",
          subtotalCents,
          discountCents,
          shippingCents,
          taxCents: 0,
          totalCents: subtotalCents - discountCents + shippingCents,
          items: {
            create: validLines.map((line) => ({
              productId: line.product.id,
              title: line.product.title,
              quantity: line.quantity,
              unitPriceCents: line.product.priceCents,
              totalCents: line.product.priceCents * line.quantity
            }))
          }
        }
      });
      dbOrderId = order.id;
    } catch (error) {
      console.warn("Could not persist order before payment:", error);
    }
  }

  if (!square || !locationId) {
    return NextResponse.json(
      { error: "Payments are not yet configured. Please call (772) 528-5208 to place an order." },
      { status: 503 }
    );
  }

  const lineItems = validLines.map((line) => ({
    name: line.product.title,
    quantity: String(line.quantity),
    basePriceMoney: {
      amount: BigInt(line.product.priceCents),
      currency: "USD" as const
    },
    note: line.product.shortDescription?.slice(0, 200) || undefined
  }));

  if (discountCents > 0) {
    lineItems.push({
      name: `Discount (${discountCode?.toUpperCase()})`,
      quantity: "1",
      basePriceMoney: { amount: BigInt(-discountCents), currency: "USD" },
      note: undefined
    });
  }

  if (shippingCents > 0) {
    lineItems.push({
      name: "Ground shipping (3-7 business days)",
      quantity: "1",
      basePriceMoney: { amount: BigInt(shippingCents), currency: "USD" },
      note: undefined
    });
  }

  try {
    const redirectUrl = absoluteUrl(
      `/order-confirmation?orderNumber=${encodeURIComponent(number)}${dbOrderId ? `&orderId=${encodeURIComponent(dbOrderId)}` : ""}`
    );

    const response = await square.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId,
        referenceId: dbOrderId ?? number,
        lineItems
      },
      checkoutOptions: {
        redirectUrl,
        askForShippingAddress: true,
        merchantSupportEmail: process.env.OWNER_NOTIFICATION_EMAIL || undefined
      },
      prePopulatedData: {
        buyerEmail: email
      }
    });

    const paymentLinkUrl = response.paymentLink?.url;
    if (!paymentLinkUrl) {
      throw new Error("Square did not return a payment URL.");
    }

    if (dbOrderId && response.paymentLink?.orderId) {
      try {
        await prisma.order.update({
          where: { id: dbOrderId },
          data: { stripeCheckoutSessionId: response.paymentLink.orderId }
        });
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ url: paymentLinkUrl });
  } catch (error) {
    console.error("Square payment link creation failed:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again or call (772) 528-5208." },
      { status: 500 }
    );
  }
}
