import { hasCloverConfig } from "@/lib/clover";
import { hasSquareConfig } from "@/lib/square";

export type PaymentProvider = "square" | "clover";

/**
 * Returns which payment provider should be used for new checkout sessions.
 *
 * Selection order:
 *  1. PAYMENT_PROVIDER env var, if it names a known provider
 *  2. Whichever provider has its credentials configured (Clover preferred —
 *     Clover is the active provider; Square is legacy)
 *  3. Default to "clover"
 */
export function getPaymentProvider(): PaymentProvider {
  const explicit = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (explicit === "clover") return "clover";
  if (explicit === "square") return "square";

  if (hasCloverConfig()) return "clover";
  if (hasSquareConfig()) return "square";
  return "clover";
}

export function isPaymentProviderConfigured(provider: PaymentProvider): boolean {
  return provider === "clover" ? hasCloverConfig() : hasSquareConfig();
}
