import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/db";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signatureHeader: string | null, requestUrl: string) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signatureHeader) return false;

  const expected = createHmac("sha256", key).update(requestUrl + rawBody).digest("base64");
  const provided = Buffer.from(signatureHeader, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuf.length) return false;
  try {
    return timingSafeEqual(provided, expectedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  // Skip verification only if a signing key has not been configured yet (dev).
  if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    const verified = verifySignature(rawBody, signature, request.url);
    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: { type?: string; data?: { object?: { payment?: { status?: string; orderId?: string; referenceId?: string; amountMoney?: { amount?: number | bigint } } } } } = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const payment = event.data?.object?.payment;
  if (!event.type || !payment) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (event.type === "payment.updated" && payment.status === "COMPLETED" && hasDatabaseUrl()) {
    const reference = payment.referenceId;
    if (reference) {
      try {
        const order = await prisma.order.findFirst({
          where: { OR: [{ id: reference }, { orderNumber: reference }] }
        });
        if (order && order.status !== "PAID") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" }
          });
        }
      } catch (error) {
        console.warn("Square webhook order update failed:", error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
