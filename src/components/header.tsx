"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniCart } from "@/components/mini-cart";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

const leftNavItems = [
  { href: "/shop", label: "Shop" },
  { href: "/#olive-journey", label: "Olive Journey" },
  { href: "/pairings", label: "Pairings" }
];

const rightNavItems = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const navItems = [...leftNavItems, ...rightNavItems];

/**
 * Global header search. On submit it routes to /shop?query=<term> — the shop
 * page reads the `query` param to pre-filter results. The param name is the
 * contract shared with shop-client; keep it exactly `query`.
 */
function HeaderSearch({
  variant,
  onSubmitted
}: {
  variant: "desktop" | "mobile";
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const inputId = `header-search-${variant}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    router.push(trimmed ? `/shop?query=${encodeURIComponent(trimmed)}` : "/shop");
    onSubmitted?.();
  }

  const isMobile = variant === "mobile";

  return (
    <form role="search" onSubmit={handleSubmit} className={isMobile ? "relative" : "relative w-44 xl:w-56"}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2",
          isMobile ? "text-olive-700/55" : "text-cream/70"
        )}
        aria-hidden
      />
      <Input
        id={inputId}
        type="search"
        name="query"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search oils…"
        autoComplete="off"
        className={cn(
          "h-10 pl-9",
          isMobile
            ? ""
            : "border-cream/25 bg-white/10 text-cream placeholder:text-cream/60 focus:border-gold-400 focus:ring-gold-400/20"
        )}
      />
    </form>
  );
}

export function Header() {
  const [solid, setSolid] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { itemCount, openCart } = useCart();

  // Opening the cart icon should pop the same drawer that an add does, so the
  // header badge and the mini-cart stay in sync.
  function handleCartClick(event: React.MouseEvent) {
    event.preventDefault();
    openCart();
    setOpen(false);
  }

  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 backdrop-blur-md transition duration-500",
        solid || open
          ? "border-b border-cream/10 bg-olive-900/75 shadow-md backdrop-blur-xl"
          : "border-b border-cream/15 bg-olive-900/40 shadow-md"
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-5 lg:hidden">
        <Link href="/" className="flex items-center" aria-label="Greek Olive Fusion home">
          <Image
            src="/brand/greek-olive-fusion-logo.png"
            alt="Greek Olive Fusion"
            width={208}
            height={64}
            priority
            className="h-12 w-auto"
          />
        </Link>
        <button
          className="inline-flex size-11 items-center justify-center rounded-sm border border-olive-700/15 bg-white/55 text-olive-900"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className="container hidden h-[135px] items-start gap-6 overflow-visible lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <nav className="flex h-[135px] items-center justify-end gap-8" aria-label="Primary navigation left">
          {leftNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-semibold uppercase tracking-wide text-cream drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition hover:text-gold-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="flex items-start justify-self-center self-start"
          aria-label="Greek Olive Fusion home"
        >
          <Image
            src="/brand/greek-olive-fusion-logo.png"
            alt="Greek Olive Fusion"
            width={135}
            height={135}
            priority
            className="h-[135px] w-[135px]"
          />
        </Link>

        <div className="flex h-[135px] items-center justify-between gap-5">
          <nav className="flex items-center gap-8" aria-label="Primary navigation right">
            {rightNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-semibold uppercase tracking-wide text-cream drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition hover:text-gold-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <HeaderSearch variant="desktop" />
            <Button
              asChild
              variant="ghost"
              aria-label="Account"
              className="text-cream hover:bg-cream/10 hover:text-gold-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
            >
              <Link href="/account">
                <UserRound className="size-4" />
                Account
              </Link>
            </Button>
            <Button asChild variant="secondary" aria-label={`Cart with ${itemCount} items`}>
              <Link href="/cart" onClick={handleCartClick} className="relative">
                <ShoppingBag className="size-4" />
                Cart
                {itemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold-400 text-[11px] text-ink">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-olive-700/10 bg-parchment lg:hidden">
          <nav className="container grid gap-1 py-5" aria-label="Mobile navigation">
            <div className="pb-2">
              <HeaderSearch variant="mobile" onSubmitted={() => setOpen(false)} />
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-3 text-base font-semibold text-olive-900 hover:bg-olive-700/10"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button asChild variant="secondary">
                <Link href="/account" onClick={() => setOpen(false)}>
                  <UserRound className="size-4" />
                  Account
                </Link>
              </Button>
              <Button asChild>
                <Link href="/cart" onClick={handleCartClick}>
                  <ShoppingBag className="size-4" />
                  Cart {itemCount ? `(${itemCount})` : ""}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}

      <MiniCart />
    </header>
  );
}
