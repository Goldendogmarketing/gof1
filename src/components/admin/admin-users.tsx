"use client";

import * as React from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  isMaster: boolean;
  createdAt: string;
};

type Props = {
  users: AdminUserRow[];
  /** Is the *viewer* the master admin? Controls whether the invite form + revoke buttons render. */
  viewerIsMaster: boolean;
};

export function AdminUsers({ users, viewerIsMaster }: Props) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "STAFF">("ADMIN");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Could not create user.");
        return;
      }
      setSuccess(`Granted ${role.toLowerCase()} access to ${email}. Share the password with them securely.`);
      setEmail("");
      setName("");
      setPassword("");
      setRole("ADMIN");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revoke(userId: string, userEmail: string) {
    if (!window.confirm(`Revoke admin access for ${userEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(body.error ?? "Could not revoke access.");
        return;
      }
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not revoke access.");
    }
  }

  function generatePassword() {
    // 16 chars, mix of upper/lower/digits/symbols (no ambiguous: 0OIl1).
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    let out = "";
    for (const byte of bytes) out += chars[byte % chars.length];
    setPassword(out);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      {/* List */}
      <div className="overflow-hidden rounded-md border border-olive-900/10 bg-white/60 shadow-soft">
        <div className="grid gap-1 p-4">
          {users.length === 0 ? (
            <p className="px-2 py-6 text-sm text-ink/60">
              No admin or staff users in the database yet. The master admin is set via the
              <code className="mx-1 rounded bg-cream px-1.5 py-0.5 text-xs font-mono">MASTER_ADMIN_EMAIL</code>
              env var.
            </p>
          ) : (
            users.map((user) => (
              <article
                key={user.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-olive-900/10 py-4 last:border-b-0"
              >
                <div>
                  <h2 className="font-display text-xl text-ink">{user.name ?? user.email}</h2>
                  <p className="text-sm text-ink/60">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{user.role}</Badge>
                    {user.isMaster ? (
                      <Badge className="border-gold-400/40 text-gold-600">Master admin</Badge>
                    ) : null}
                  </div>
                </div>
                <div>
                  {viewerIsMaster && !user.isMaster ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => revoke(user.id, user.email)}
                      title={`Revoke admin access for ${user.email}`}
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Invite form (master only) */}
      {viewerIsMaster ? (
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-md border border-olive-900/10 bg-white/60 p-5 shadow-soft h-fit"
        >
          <div>
            <h2 className="font-display text-2xl text-ink">Grant admin access</h2>
            <p className="mt-1 text-sm text-ink/60">
              The user can sign in at <code className="font-mono text-xs">/account</code> with the email + password
              you set here. Share the password securely (1Password, Signal, etc.) — don&apos;t email it.
            </p>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-olive-900">Email</span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-olive-900">Name</span>
            <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-olive-900">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
              className="h-11 rounded-sm border border-olive-700/20 bg-white/75 px-3 text-sm text-ink outline-none transition focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
            >
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-olive-900">Temporary password</span>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs font-semibold text-olive-700 hover:underline"
              >
                Generate
              </button>
            </div>
            <Input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              placeholder="Min 8 characters"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-terracotta">{error}</p> : null}
          {success ? <p className="text-sm font-semibold text-olive-700">{success}</p> : null}

          <Button type="submit" disabled={submitting}>
            <UserPlus className="size-4" />
            {submitting ? "Adding…" : "Add admin"}
          </Button>
        </form>
      ) : (
        <div className="rounded-md border border-olive-900/10 bg-white/60 p-5 text-sm text-ink/60 shadow-soft h-fit">
          Only the master admin can grant or revoke admin access.
        </div>
      )}
    </div>
  );
}
