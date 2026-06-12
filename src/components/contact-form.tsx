"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sent" | "error" | "email-not-configured";

export function ContactForm() {
  const [status, setStatus] = React.useState<Status>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("sent");
        event.currentTarget.reset();
      } else if (body?.reason === "email-not-configured") {
        setStatus("email-not-configured");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Name
        <Input name="name" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Email
        <Input name="email" type="email" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Subject
        <Input name="subject" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Message
        <Textarea name="message" required />
      </label>
      {status === "sent" ? (
        <p className="text-sm font-semibold text-olive-700">
          Message sent. We&apos;ll get back to you shortly.
        </p>
      ) : null}
      {status === "email-not-configured" ? (
        <p className="rounded-sm border border-gold-400/40 bg-gold-50/40 p-3 text-sm text-ink/75">
          Our contact inbox isn&apos;t fully set up yet. Please email us directly at{" "}
          <a href="mailto:support@greekolivefusion.com" className="underline">
            support@greekolivefusion.com
          </a>{" "}
          and we&apos;ll respond within one business day.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm font-semibold text-terracotta">
          Message could not be sent. Please email{" "}
          <a href="mailto:support@greekolivefusion.com" className="underline">
            support@greekolivefusion.com
          </a>{" "}
          directly.
        </p>
      ) : null}
      <Button type="submit">
        <Send className="size-4" />
        Send Message
      </Button>
    </form>
  );
}
