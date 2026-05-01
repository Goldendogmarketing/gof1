"use client";

import * as React from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountPanel({ next = "/admin" }: { next?: string }) {
  const { data: session, status } = useSession();
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

  if (status === "authenticated") {
    return (
      <section className="rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft">
        <ShieldCheck className="mb-4 size-9 text-olive-700" />
        <h2 className="font-display text-3xl text-ink">Signed in</h2>
        <p className="mt-2 text-sm text-ink/65">{session.user?.email}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin">Open Admin</Link>
          </Button>
          <Button variant="secondary" onClick={() => signOut()}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </section>
    );
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
