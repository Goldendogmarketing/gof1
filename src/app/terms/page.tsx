import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { TERMS_CONTENT } from "@/content/legal/terms";

export const metadata = {
  title: "Terms of Service — Greek Olive Fusion",
  description: "The terms that govern your use of greekolivefusion.com and any purchases made through it."
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      eyebrow="The fine print"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={TERMS_CONTENT} />
    </LegalLayout>
  );
}
