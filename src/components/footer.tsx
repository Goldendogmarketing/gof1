"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

const exploreLinks = [
  ["Shop", "/shop"],
  ["Olive Journey", "/#olive-journey"],
  ["Pairings", "/pairings"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"]
];

const policyLinks = [
  ["Shipping Policy", "/shipping"],
  ["Returns & Refunds", "/returns"],
  ["Privacy Policy", "/privacy"],
  ["Terms of Service", "/terms"],
  ["Accessibility", "/accessibility"]
];

type NewsletterStatus = "idle" | "submitting" | "success" | "error";

function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<NewsletterStatus>("idle");
  const [message, setMessage] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body?.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing. Keep an eye on your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(body?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Newsletter signup">
      <label htmlFor="newsletter-email" className="block text-sm text-cream/75">
        Get recipes, new arrivals, and offers.
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-describedby="newsletter-status"
          className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-cream px-4 py-2 text-sm font-semibold text-olive-900 transition hover:bg-white disabled:opacity-60"
        >
          {status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`min-h-[1.25rem] text-xs ${status === "error" ? "text-gold-300" : "text-cream/70"}`}
      >
        {message}
      </p>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-olive-900/10 bg-olive-900 text-cream">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-md space-y-5">
          <Image src="/brand/greek-olive-fusion-logo.png" alt="Greek Olive Fusion" width={224} height={69} />
          <p className="text-sm leading-7 text-cream/75">
            Premium Greek extra virgin and infused olive oils built around aroma, texture, quality, and the ritual
            of a generous Mediterranean table.
          </p>
          <div className="space-y-1 text-xs text-cream/55">
            <p>
              Questions?{" "}
              <a href="mailto:support@greekolivefusion.com" className="underline hover:text-white">
                support@greekolivefusion.com
              </a>
            </p>
            <p>
              <a href="tel:+17725285208" className="underline hover:text-white">
                +1 (772) 528-5208
              </a>
            </p>
            <p>8320 Singleton Pl, Keystone Heights, FL 32656</p>
          </div>
          <NewsletterForm />
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl">Explore</h2>
          <nav className="grid gap-3 text-sm text-cream/75" aria-label="Footer explore navigation">
            {exploreLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl">Policies</h2>
          <nav className="grid gap-3 text-sm text-cream/75" aria-label="Footer policy navigation">
            {policyLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream/55">
        © {new Date().getFullYear()} Greek Olive Fusion. Connected to Ariston Specialties.
      </div>
    </footer>
  );
}
