import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { FAQ_CONTENT } from "@/content/legal/faq";

export const metadata: Metadata = {
  title: "FAQ — Greek Olive Fusion",
  description:
    "Answers to common questions about Greek Olive Fusion: shipping times and free-shipping threshold, freshness and harvest, allergens, returns and damage, sourcing, and how our infused olive oils are made.",
  alternates: {
    canonical: "https://www.greekolivefusion.com/faq"
  }
};

export default function FaqPage() {
  return (
    <LegalLayout
      title="Frequently Asked Questions"
      eyebrow="Help & answers"
      lastUpdated="June 12, 2026"
    >
      <MarkdownContent source={FAQ_CONTENT} />
    </LegalLayout>
  );
}
