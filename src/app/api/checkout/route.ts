import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations";
import { getProducts } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { formatMoney, orderNumber } from "@/lib/format";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { sendOrderEmail } from "@/lib/email";

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
  const stripe = getStripe();

  if (!stripe) {
    const number = orderNumber();
    const shippingCents = subtotalCents > 7500 ? 0 : 900;
    const taxCents = Math.round((subtotalCents - discountCents) * 0.07);
    const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

    if (hasDatabaseUrl()) {
      try {
        const customer = await prisma.customer.upsert({
          where: { email },
          update: {},
          create: { email }
        });

        await prisma.order.create({
          data: {
            orderNumber: number,
            email,
            customerId: customer.id,
            status: "PENDING",
            subtotalCents,
            discountCents,
            shippingCents,
            taxCents,
            totalCents,
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
      } catch (error) {
        console.warn("Could not persist demo order:", error);
      }
    }

    await sendOrderEmail({ to: email, orderNumber: number, total: formatMoney(totalCents) });

    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/order-confirmation?demo=1`
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    shipping_options:
      subtotalCents > 7500
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "usd" },
                display_name: "Bundle shipping over $75"
              }
            }
          ]
        : [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 900, currency: "usd" },
                display_name: "Ground shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 3 },
                  maximum: { unit: "business_day", value: 7 }
                }
              }
            }
          ],
    line_items: validLines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: line.product.currency.toLowerCase(),
        unit_amount: line.product.priceCents,
        product_data: {
          name: line.product.title,
          description: line.product.shortDescription,
          images: [absoluteUrl(line.product.image)],
          metadata: {
            productId: line.product.id,
            slug: line.product.slug
          }
        }
      }
    })),
    metadata: {
      discountCode: discountCode ?? "",
      source: "greek-olive-fusion"
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/cart`
  });

  return NextResponse.json({ url: session.url });
}
