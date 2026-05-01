import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid contact form." }, { status: 400 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.ORDER_FROM_EMAIL ?? "Greek Olive Fusion <hello@example.com>",
    to: process.env.OWNER_NOTIFICATION_EMAIL ?? "hello@example.com",
    subject: `Greek Olive Fusion contact: ${parsed.data.subject}`,
    replyTo: parsed.data.email,
    text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`
  });

  return NextResponse.json({ ok: true });
}
