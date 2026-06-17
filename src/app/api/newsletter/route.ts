import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().trim().email()
});

export async function POST(request: Request) {
  // Parse the JSON body defensively — a malformed body should be a clean 400,
  // never an unhandled throw.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const { email } = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  // Graceful degradation: if Resend (or an audience to add the contact to) isn't
  // configured, we don't fail the customer. We log it for the operator and return
  // success so the signup UX still works — mirrors how the order emails degrade
  // when RESEND_API_KEY is missing (see src/lib/email.ts).
  if (!apiKey || !audienceId) {
    console.warn("Newsletter signup skipped: RESEND_API_KEY or RESEND_AUDIENCE_ID missing.");
    return NextResponse.json({ ok: true, subscribed: false });
  }

  // Adding the contact should never surface a 500 to the client. If Resend errors
  // (or throws), we swallow it, log it, and still return a clean success response.
  try {
    const resend = new Resend(apiKey);
    const result = await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false
    });

    if (result.error) {
      console.warn(`Newsletter signup: Resend returned an error — ${result.error.message}`);
      return NextResponse.json({ ok: true, subscribed: false });
    }

    return NextResponse.json({ ok: true, subscribed: true });
  } catch (err) {
    console.warn(`Newsletter signup: unexpected error — ${String(err)}`);
    return NextResponse.json({ ok: true, subscribed: false });
  }
}
