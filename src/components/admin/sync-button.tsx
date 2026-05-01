"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  async function sync() {
    setState("loading");
    setMessage(null);
    const response = await fetch("/api/admin/feed-sync", { method: "POST" });
    const body = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(body.error ?? "Sync failed.");
      return;
    }

    setState("done");
    setMessage(`${body.productsSeen} seen, ${body.productsUpserted} updated.`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={sync} disabled={state === "loading"} variant="secondary">
        <RefreshCcw className={state === "loading" ? "size-4 animate-spin" : "size-4"} />
        Sync Product Feed
      </Button>
      {message ? <span className="text-sm text-ink/60">{message}</span> : null}
    </div>
  );
}
