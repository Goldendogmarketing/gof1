import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid contact form." }, { status: 400 });

  if (!process.env.RESEND_API_KEY || !process.env.OWNER_NOTIFICATION_EMAIL) {
    // No email transport configured yet. Don't lie to the customer about delivery —
    // tell them we received the message but couldn't dispatch it. The client surfaces
    // a clear "we couldn't send right now, please email us directly" message.
    console.warn("Contact form skipped: RESEND_API_KEY or OWNER_NOTIFICATION_EMAIL missing.");
    return NextResponse.json({ ok: false, reason: "email-not-configured" }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.ORDER_FROM_EMAIL ?? "Greek Olive Fusion <orders@greekolivefusion.com>",
    to: process.env.OWNER_NOTIFICATION_EMAIL,
    subject: `Greek Olive Fusion contact: ${parsed.data.subject}`,
    replyTo: parsed.data.email,
    text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`
  });

  return NextResponse.json({ ok: true });
}
