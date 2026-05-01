"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setStatus(response.ok ? "sent" : "error");
    if (response.ok) event.currentTarget.reset();
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
      {status === "sent" ? <p className="text-sm font-semibold text-olive-700">Message sent.</p> : null}
      {status === "error" ? <p className="text-sm font-semibold text-terracotta">Message could not be sent.</p> : null}
      <Button type="submit">
        <Send className="size-4" />
        Send Message
      </Button>
    </form>
  );
}
