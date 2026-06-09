import { Resend } from "resend";
import type { ShippingAddress } from "@/lib/validations";
import { formatMoney } from "@/lib/format";

// ---------------------------------------------------------------------------
// Shared types + helpers
// ---------------------------------------------------------------------------

export type OrderEmailLineItem = {
  title: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type OrderEmailPayload = {
  orderNumber: string;
  customerEmail: string;
  shippingAddress: ShippingAddress | null;
  lineItems: OrderEmailLineItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency?: string;
  /** Optional URL back into the admin to view the order. */
  adminUrl?: string;
};

type SendResult = { sent: boolean; reason?: string };

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  return process.env.ORDER_FROM_EMAIL ?? "Greek Olive Fusion <orders@greekolivefusion.com>";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAddressBlock(address: ShippingAddress | null) {
  if (!address) return "<em>Address not collected</em>";
  const lines = [
    `${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}`,
    escapeHtml(address.addressLine1),
    address.addressLine2 ? escapeHtml(address.addressLine2) : null,
    `${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.zip)}`,
    `Phone: ${escapeHtml(address.phone)}`
  ].filter(Boolean);
  return lines.join("<br/>");
}

function renderAddressText(address: ShippingAddress | null) {
  if (!address) return "(address not collected)";
  return [
    `${address.firstName} ${address.lastName}`,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state} ${address.zip}`,
    `Phone: ${address.phone}`
  ]
    .filter(Boolean)
    .join("\n");
}

function renderLineItemsTable(items: OrderEmailLineItem[], currency = "USD") {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e1d6;">
            <div style="font-weight:600;color:#172214;">${escapeHtml(item.title)}</div>
            <div style="color:#7a7567;font-size:13px;">Qty ${item.quantity} &middot; ${formatMoney(item.unitPriceCents, currency)} each</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e1d6;text-align:right;font-weight:600;color:#172214;">
            ${formatMoney(item.totalCents, currency)}
          </td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function renderTotalsBlock(payload: OrderEmailPayload) {
  const currency = payload.currency ?? "USD";
  const row = (label: string, value: number, opts: { bold?: boolean; muted?: boolean } = {}) => `
    <tr>
      <td style="padding:4px 0;color:${opts.muted ? "#7a7567" : "#172214"};${opts.bold ? "font-weight:700;font-size:16px;" : "font-size:14px;"}">${label}</td>
      <td style="padding:4px 0;text-align:right;color:${opts.muted ? "#7a7567" : "#172214"};${opts.bold ? "font-weight:700;font-size:16px;" : "font-size:14px;"}">${formatMoney(value, currency)}</td>
    </tr>`;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:12px;">
      ${row("Subtotal", payload.subtotalCents)}
      ${payload.discountCents > 0 ? row("Discount", -payload.discountCents, { muted: true }) : ""}
      ${row("Shipping", payload.shippingCents)}
      ${payload.taxCents > 0 ? row("Tax", payload.taxCents) : ""}
      ${row("Total", payload.totalCents, { bold: true })}
    </table>`;
}

function wrapHtml(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f3eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#172214;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f6f3eb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:6px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <tr><td>
              <h1 style="margin:0 0 16px;font-size:22px;color:#3d4a2c;letter-spacing:0.01em;">${escapeHtml(title)}</h1>
              ${bodyHtml}
              <p style="margin:32px 0 0;color:#7a7567;font-size:12px;border-top:1px solid #e5e1d6;padding-top:16px;">Greek Olive Fusion &middot; greekolivefusion.com</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1) Customer receipt
// ---------------------------------------------------------------------------

export async function sendCustomerReceipt(payload: OrderEmailPayload): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not set" };

  const body = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Thanks for ordering from Greek Olive Fusion. We&rsquo;ll send another note when your bottles ship.</p>
    <p style="margin:0 0 24px;font-size:13px;color:#7a7567;">Order <strong style="color:#172214;">${escapeHtml(payload.orderNumber)}</strong></p>
    ${renderLineItemsTable(payload.lineItems, payload.currency)}
    ${renderTotalsBlock(payload)}
    <h2 style="margin:28px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Shipping to</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;">${renderAddressBlock(payload.shippingAddress)}</p>
  `;

  const result = await resend.emails.send({
    from: getFromAddress(),
    to: payload.customerEmail,
    subject: `Order confirmed — ${payload.orderNumber}`,
    html: wrapHtml("Order confirmed", body)
  });

  return { sent: !result.error, reason: result.error?.message };
}

// ---------------------------------------------------------------------------
// 2) Owner notification (Joe)
// ---------------------------------------------------------------------------

export async function sendOwnerOrderNotification(payload: OrderEmailPayload): Promise<SendResult> {
  const to = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!to) return { sent: false, reason: "OWNER_NOTIFICATION_EMAIL not set" };

  const resend = getResend();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not set" };

  const customerName = payload.shippingAddress
    ? `${payload.shippingAddress.firstName} ${payload.shippingAddress.lastName}`
    : payload.customerEmail;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">A new paid order just landed.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#7a7567;width:140px;">Order</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(payload.orderNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#7a7567;">Total</td><td style="padding:6px 0;font-weight:600;">${formatMoney(payload.totalCents, payload.currency ?? "USD")}</td></tr>
      <tr><td style="padding:6px 0;color:#7a7567;">Customer</td><td style="padding:6px 0;">${escapeHtml(customerName)}</td></tr>
      <tr><td style="padding:6px 0;color:#7a7567;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(payload.customerEmail)}" style="color:#3d4a2c;">${escapeHtml(payload.customerEmail)}</a></td></tr>
    </table>
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Items</h2>
    ${renderLineItemsTable(payload.lineItems, payload.currency)}
    ${renderTotalsBlock(payload)}
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Ship to</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;">${renderAddressBlock(payload.shippingAddress)}</p>
    ${payload.adminUrl ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(payload.adminUrl)}" style="display:inline-block;background:#3d4a2c;color:#f6f3eb;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600;">Open in admin</a></p>` : ""}
  `;

  const result = await resend.emails.send({
    from: getFromAddress(),
    to,
    replyTo: payload.customerEmail,
    subject: `🎉 New order ${payload.orderNumber} — ${formatMoney(payload.totalCents, payload.currency ?? "USD")}`,
    html: wrapHtml("New paid order", body)
  });

  return { sent: !result.error, reason: result.error?.message };
}

// ---------------------------------------------------------------------------
// 3) Drop-ship fulfillment email
// ---------------------------------------------------------------------------

export async function sendDropshipOrderEmail(payload: OrderEmailPayload): Promise<SendResult> {
  const to = process.env.DROPSHIP_NOTIFICATION_EMAIL;
  if (!to) return { sent: false, reason: "DROPSHIP_NOTIFICATION_EMAIL not set" };

  const resend = getResend();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not set" };

  const customerName = payload.shippingAddress
    ? `${payload.shippingAddress.firstName} ${payload.shippingAddress.lastName}`
    : payload.customerEmail;

  // Plain-text version is the source of truth here — fulfillment teams usually
  // copy/paste into their warehouse system. HTML mirrors it for readability.
  const textLines = [
    `GREEK OLIVE FUSION — FULFILL ORDER`,
    ``,
    `Order #:    ${payload.orderNumber}`,
    `Customer:   ${customerName}`,
    `Email:      ${payload.customerEmail}`,
    ``,
    `SHIP TO`,
    `-------`,
    renderAddressText(payload.shippingAddress),
    ``,
    `ITEMS`,
    `-----`,
    ...payload.lineItems.map(
      (item) => `${item.quantity}x  ${item.title}   (${formatMoney(item.unitPriceCents, payload.currency ?? "USD")} ea = ${formatMoney(item.totalCents, payload.currency ?? "USD")})`
    ),
    ``,
    `TOTALS`,
    `------`,
    `Subtotal:   ${formatMoney(payload.subtotalCents, payload.currency ?? "USD")}`,
    payload.discountCents > 0 ? `Discount:   -${formatMoney(payload.discountCents, payload.currency ?? "USD")}` : "",
    `Shipping:   ${formatMoney(payload.shippingCents, payload.currency ?? "USD")}`,
    payload.taxCents > 0 ? `Tax:        ${formatMoney(payload.taxCents, payload.currency ?? "USD")}` : "",
    `Total:      ${formatMoney(payload.totalCents, payload.currency ?? "USD")}`
  ]
    .filter((line) => line !== "")
    .join("\n");

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">A new paid order is ready to fulfill.</p>
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Order</h2>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#7a7567;width:140px;">Order #</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(payload.orderNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#7a7567;">Customer</td><td style="padding:6px 0;">${escapeHtml(customerName)}</td></tr>
      <tr><td style="padding:6px 0;color:#7a7567;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(payload.customerEmail)}" style="color:#3d4a2c;">${escapeHtml(payload.customerEmail)}</a></td></tr>
    </table>
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Ship to</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;">${renderAddressBlock(payload.shippingAddress)}</p>
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#7a7567;">Items</h2>
    ${renderLineItemsTable(payload.lineItems, payload.currency)}
    ${renderTotalsBlock(payload)}
    <hr style="border:none;border-top:1px solid #e5e1d6;margin:24px 0;"/>
    <p style="margin:0;font-size:12px;color:#7a7567;">A plain-text copy of this order is also included with this email for easy copy/paste.</p>
  `;

  const result = await resend.emails.send({
    from: getFromAddress(),
    to,
    replyTo: payload.customerEmail,
    subject: `Fulfill order ${payload.orderNumber} — ${customerName}`,
    html: wrapHtml(`Fulfill order ${payload.orderNumber}`, body),
    text: textLines
  });

  return { sent: !result.error, reason: result.error?.message };
}

// ---------------------------------------------------------------------------
// Convenience: fire all three in parallel with independent error isolation.
// Never throws — webhook handlers should always be able to await this and
// then return 200 to Clover.
// ---------------------------------------------------------------------------

export async function sendAllOrderEmails(payload: OrderEmailPayload) {
  const results = await Promise.all([
    sendCustomerReceipt(payload).catch((err) => ({ sent: false, reason: `customer: ${String(err)}` })),
    sendOwnerOrderNotification(payload).catch((err) => ({ sent: false, reason: `owner: ${String(err)}` })),
    sendDropshipOrderEmail(payload).catch((err) => ({ sent: false, reason: `dropship: ${String(err)}` }))
  ]);

  return {
    customer: results[0],
    owner: results[1],
    dropship: results[2]
  };
}

// Legacy export kept for backwards compatibility with any old call sites.
export async function sendOrderEmail(input: { to: string; orderNumber: string; total: string }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: `Greek Olive Fusion order ${input.orderNumber}`,
    html: `<div style="font-family:Arial,sans-serif;color:#172214"><h1>Thank you for your order</h1><p>We received order <strong>${escapeHtml(input.orderNumber)}</strong>.</p><p>Total: <strong>${escapeHtml(input.total)}</strong></p></div>`
  });
}
