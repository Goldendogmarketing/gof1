"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountPanel({ next = "/account" }: { next?: string }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: next
    });

    if (result?.error) {
      setError("Email or password did not match.");
      return;
    }

    window.location.href = result?.url ?? next;
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
      <div>
        <label className="mb-2 block text-sm font-semibold text-olive-900" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-olive-900" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm font-semibold text-terracotta">{error}</p> : null}
      <Button type="submit">
        <LogIn className="size-4" />
        Sign in
      </Button>
    </form>
  );
}
