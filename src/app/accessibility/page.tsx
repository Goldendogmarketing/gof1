import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { ACCESSIBILITY_CONTENT } from "@/content/legal/accessibility";

export const metadata = {
  title: "Accessibility — Greek Olive Fusion",
  description:
    "Our ongoing commitment to making greekolivefusion.com usable for everyone, including people with disabilities."
};

export default function AccessibilityPage() {
  return (
    <LegalLayout
      title="Accessibility"
      eyebrow="A welcoming table"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={ACCESSIBILITY_CONTENT} />
    </LegalLayout>
  );
}
