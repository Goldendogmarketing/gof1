import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Greek Olive Fusion for orders, press, and customer support."
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-28 lg:pt-[240px]">
      <div className="container grid gap-10 py-12 lg:grid-cols-[0.8fr_1fr]">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase text-gold-600">Contact</p>
          <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">Bring Greek Olive Fusion to your table.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/68">
            Reach out for product questions, pairings, gifting, or support with an existing order.
          </p>
        </section>
        <ContactForm />
      </div>
    </main>
  );
}
