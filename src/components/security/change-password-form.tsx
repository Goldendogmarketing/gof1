"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "idle" | "ok" | "error";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("ok");
        setMessage(
          body.created
            ? "Password set. Sign in with your new password next time — your env-based admin login will keep working as a fallback."
            : "Password updated."
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus("error");
        setMessage(body.error ?? "Could not update password.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid max-w-md gap-4 rounded-md border border-olive-900/10 bg-white/60 p-6 shadow-soft"
    >
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Current password
        <Input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        New password
        <Input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={10}
        />
        <span className="text-xs font-normal text-ink/55">At least 10 characters.</span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-olive-900">
        Confirm new password
        <Input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={10}
        />
      </label>
      {message ? (
        <p
          className={`text-sm ${
            status === "ok"
              ? "font-semibold text-olive-700"
              : status === "error"
              ? "font-semibold text-terracotta"
              : "text-ink/65"
          }`}
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        <Lock className="size-4" />
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
