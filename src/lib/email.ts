import { Resend } from "resend";

export async function sendOrderEmail(input: {
  to: string;
  orderNumber: string;
  total: string;
}) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.ORDER_FROM_EMAIL ?? "Greek Olive Fusion <orders@example.com>";

  return resend.emails.send({
    from,
    to: input.to,
    subject: `Greek Olive Fusion order ${input.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#172214">
        <h1>Thank you for your order</h1>
        <p>We received order <strong>${input.orderNumber}</strong>.</p>
        <p>Total: <strong>${input.total}</strong></p>
      </div>
    `
  });
}
