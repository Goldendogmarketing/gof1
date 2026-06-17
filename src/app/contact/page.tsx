import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
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

          <dl className="mt-10 grid gap-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-olive-700" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-ink/55">Email</dt>
                <dd className="mt-1 text-lg text-ink">
                  <a href="mailto:support@greekolivefusion.com" className="text-olive-700 underline hover:text-olive-900">
                    support@greekolivefusion.com
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-olive-700" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-ink/55">Phone</dt>
                <dd className="mt-1 text-lg text-ink">
                  <a href="tel:+17725285208" className="text-olive-700 underline hover:text-olive-900">
                    +1 (772) 528-5208
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-olive-700" aria-hidden="true" />
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-ink/55">Mailing address</dt>
                <dd className="mt-1 text-lg leading-7 text-ink/80">
                  Greek Olive Fusion, LLC
                  <br />
                  8320 Singleton Pl
                  <br />
                  Keystone Heights, FL 32656
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-8 max-w-xl text-sm leading-7 text-ink/60">
            We aim to respond to every message within one business day.
          </p>
        </section>
        <ContactForm />
      </div>
    </main>
  );
}
