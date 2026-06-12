import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function hasCloverConfig() {
  return Boolean(process.env.CLOVER_API_TOKEN && process.env.CLOVER_MERCHANT_ID);
}

export function getCloverEnvironment(): "sandbox" | "production" {
  return process.env.CLOVER_ENVIRONMENT === "production" ? "production" : "sandbox";
}

/**
 * REST base URL for the Clover Ecommerce API.
 * Sandbox: https://apisandbox.dev.clover.com
 * Production: https://api.clover.com
 */
export function getCloverApiBaseUrl() {
  return getCloverEnvironment() === "production"
    ? "https://api.clover.com"
    : "https://apisandbox.dev.clover.com";
}

export function getCloverMerchantId() {
  return process.env.CLOVER_MERCHANT_ID ?? null;
}

function getCloverApiToken() {
  return process.env.CLOVER_API_TOKEN ?? null;
}

// ---------------------------------------------------------------------------
// Hosted Checkout
// https://docs.clover.com/dev/docs/creating-a-hosted-checkout-session
// ---------------------------------------------------------------------------

export type CloverLineItemInput = {
  name: string;
  /** Unit price in the smallest currency unit (cents for USD). */
  priceCents: number;
  unitQty: number;
  /** Optional per-item note (limited to ~200 chars by Clover). */
  note?: string;
};

export type CreateCheckoutInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lineItems: CloverLineItemInput[];
  /** Show the tip section on the hosted page. Defaults to false. */
  tipsEnabled?: boolean;
  /** Optional UUID of a saved hosted-checkout page config (controls branding, redirect URLs, etc.). */
  pageConfigUuid?: string;
  /**
   * Where Clover should send the customer after a successful payment. Clover's hosted
   * page accepts this as the top-level `redirectUrl` field. Falls back to the URL
   * configured on the merchant's saved pageConfig if omitted.
   */
  redirectUrl?: string;
};

export type CreateCheckoutResult = {
  href: string;
  checkoutSessionId: string;
  createdTime?: number;
  expirationTime?: number;
};

/**
 * Create a Clover Hosted Checkout session and return the URL to redirect the customer to.
 * Throws if Clover is not configured or the API rejects the request.
 */
export async function createCloverHostedCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const token = getCloverApiToken();
  const merchantId = getCloverMerchantId();
  if (!token || !merchantId) {
    throw new Error("Clover is not configured. Set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID.");
  }

  // Filter out any zero/negative-qty line items defensively — Clover rejects them.
  const lineItems = input.lineItems
    .filter((item) => item.unitQty > 0)
    .map((item) => ({
      name: item.name.slice(0, 127),
      price: item.priceCents,
      unitQty: item.unitQty,
      ...(item.note ? { note: item.note.slice(0, 200) } : {})
    }));

  if (lineItems.length === 0) {
    throw new Error("Cannot create a Clover checkout with no line items.");
  }

  const body = {
    customer: {
      email: input.email,
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {})
    },
    tips: { enabled: Boolean(input.tipsEnabled) },
    shoppingCart: { lineItems },
    ...(input.pageConfigUuid ? { pageConfigUuid: input.pageConfigUuid } : {}),
    ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {})
  };

  const response = await fetch(`${getCloverApiBaseUrl()}/invoicingcheckoutservice/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Clover-Merchant-Id": merchantId
    },
    body: JSON.stringify(body),
    // Always go straight to Clover — never serve from a cached intermediary.
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Clover checkout creation failed (${response.status}): ${text || response.statusText}`);
  }

  const data = (await response.json()) as Partial<CreateCheckoutResult> & Record<string, unknown>;
  if (!data.href || !data.checkoutSessionId) {
    throw new Error(`Clover returned an unexpected checkout response: ${JSON.stringify(data)}`);
  }

  return {
    href: data.href,
    checkoutSessionId: data.checkoutSessionId,
    createdTime: typeof data.createdTime === "number" ? data.createdTime : undefined,
    expirationTime: typeof data.expirationTime === "number" ? data.expirationTime : undefined
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// https://docs.clover.com/dev/docs/ecomm-hosted-checkout-webhook
//
// Header format: `Clover-Signature: t=<unix-seconds>,v1=<hex-hmac-sha256>`
// Signed payload: `${timestamp}.${rawBody}`
// ---------------------------------------------------------------------------

export type CloverSignatureParts = { timestamp: string; v1: string };

export function parseCloverSignatureHeader(header: string | null | undefined): CloverSignatureParts | null {
  if (!header) return null;
  const parts: Partial<CloverSignatureParts> = {};
  for (const piece of header.split(",")) {
    const [key, value] = piece.split("=").map((s) => s.trim());
    if (key === "t") parts.timestamp = value;
    if (key === "v1") parts.v1 = value;
  }
  if (!parts.timestamp || !parts.v1) return null;
  return parts as CloverSignatureParts;
}

/**
 * Verify a Clover-Signature header against the raw request body.
 *
 * @param rawBody Raw request body as received (do not parse JSON before calling this).
 * @param signatureHeader Value of the `Clover-Signature` HTTP header.
 * @param secret Signing secret from Clover Merchant Dashboard → Settings → Ecommerce → Hosted Checkout.
 * @param toleranceSeconds Reject signatures whose timestamp is older than this many seconds (default 5 min).
 */
export function verifyCloverWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!secret) return false;
  const parsed = parseCloverSignatureHeader(signatureHeader);
  if (!parsed) return false;

  // Optional timestamp tolerance — protects against replay of old captures.
  const ts = Number(parsed.timestamp);
  if (Number.isFinite(ts) && toleranceSeconds > 0) {
    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (ageSeconds > toleranceSeconds) return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${parsed.timestamp}.${rawBody}`)
    .digest("hex");

  // timingSafeEqual requires equal-length buffers.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(parsed.v1, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
