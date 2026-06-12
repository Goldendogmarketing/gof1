import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { SHIPPING_CONTENT } from "@/content/legal/shipping";

export const metadata = {
  title: "Shipping Policy — Greek Olive Fusion",
  description:
    "How long orders take, where we ship, our flat-rate and free-shipping thresholds, and how to handle damaged or lost packages."
};

export default function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Shipping Policy"
      eyebrow="How your order arrives"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={SHIPPING_CONTENT} />
    </LegalLayout>
  );
}
