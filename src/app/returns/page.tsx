import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { RETURNS_CONTENT } from "@/content/legal/returns";

export const metadata = {
  title: "Returns & Refunds — Greek Olive Fusion",
  description:
    "Damaged, defective, wrong, or unopened items — what we cover, what we don't, and how to start a return."
};

export default function ReturnsPolicyPage() {
  return (
    <LegalLayout
      title="Returns & Refunds"
      eyebrow="Make it right"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={RETURNS_CONTENT} />
    </LegalLayout>
  );
}
