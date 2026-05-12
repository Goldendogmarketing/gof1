"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
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

export function Header() {
  const [solid, setSolid] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { itemCount } = useCart();

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
          ? "border-b border-olive-700/10 bg-stonewarm/85 shadow-sm backdrop-blur-xl"
          : "border-b border-white/10 bg-stonewarm/55 shadow-sm"
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

      <div className="container hidden h-[220px] items-center gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <nav className="flex items-center justify-end gap-7" aria-label="Primary navigation left">
          {leftNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-olive-900/85 transition hover:text-olive-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="flex items-center justify-self-center"
          aria-label="Greek Olive Fusion home"
        >
          <Image
            src="/brand/greek-olive-fusion-logo.png"
            alt="Greek Olive Fusion"
            width={200}
            height={200}
            priority
            className="h-[200px] w-[200px]"
          />
        </Link>

        <div className="flex items-center justify-between gap-5">
          <nav className="flex items-center gap-7" aria-label="Primary navigation right">
            {rightNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-olive-900/85 transition hover:text-olive-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" aria-label="Account">
              <Link href="/account">
                <UserRound className="size-4" />
                Account
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" aria-label={`Cart with ${itemCount} items`}>
              <Link href="/cart" className="relative">
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
                <Link href="/cart" onClick={() => setOpen(false)}>
                  <ShoppingBag className="size-4" />
                  Cart {itemCount ? `(${itemCount})` : ""}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
