import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { orderNumber, formatMoney } from "@/lib/format";
import { sendOrderEmail } from "@/lib/email";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const number = orderNumber();
    const total = session.amount_total ?? 0;
    const email = session.customer_email ?? "unknown@example.com";

    if (hasDatabaseUrl()) {
      const customer = await prisma.customer.upsert({
        where: { email },
        update: {
          stripeId: typeof session.customer === "string" ? session.customer : undefined
        },
        create: {
          email,
          stripeId: typeof session.customer === "string" ? session.customer : undefined
        }
      });

      await prisma.order.upsert({
        where: { stripeCheckoutSessionId: session.id },
        update: {
          status: "PAID",
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          totalCents: total,
          taxCents: session.total_details?.amount_tax ?? 0,
          discountCents: session.total_details?.amount_discount ?? 0,
          shippingCents: session.shipping_cost?.amount_total ?? 0
        },
        create: {
          orderNumber: number,
          email,
          customerId: customer.id,
          status: "PAID",
          subtotalCents: session.amount_subtotal ?? total,
          discountCents: session.total_details?.amount_discount ?? 0,
          shippingCents: session.shipping_cost?.amount_total ?? 0,
          taxCents: session.total_details?.amount_tax ?? 0,
          totalCents: total,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          shippingAddress: session.shipping_details as object
        }
      });
    }

    if (session.customer_email) {
      await sendOrderEmail({
        to: session.customer_email,
        orderNumber: number,
        total: formatMoney(total)
      });
    }
  }

  return NextResponse.json({ received: true });
}
