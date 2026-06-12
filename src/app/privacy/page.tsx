import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { PRIVACY_CONTENT } from "@/content/legal/privacy";

export const metadata = {
  title: "Privacy Policy — Greek Olive Fusion",
  description:
    "How Greek Olive Fusion collects, uses, and protects your personal information, and the privacy rights you have."
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      eyebrow="Your data, our promise"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={PRIVACY_CONTENT} />
    </LegalLayout>
  );
}
