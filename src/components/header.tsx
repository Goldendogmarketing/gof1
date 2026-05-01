"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/shop", label: "Shop" },
  { href: "/olive-journey", label: "Olive Journey" },
  { href: "/pairings", label: "Pairings" },
  { href: "/about", label: "About" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/contact", label: "Contact" }
];

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
        "fixed left-0 right-0 top-0 z-50 transition duration-500",
        solid || open
          ? "border-b border-olive-700/10 bg-parchment/92 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-3" aria-label="Greek Olive Fusion home">
          <Image
            src="/brand/greek-olive-fusion-logo.svg"
            alt="Greek Olive Fusion"
            width={208}
            height={64}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-olive-900/85 transition hover:text-olive-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm" aria-label="Account and admin">
            <Link href="/account">
              <UserRound className="size-4" />
              Account/Admin
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

        <button
          className="inline-flex size-11 items-center justify-center rounded-sm border border-olive-700/15 bg-white/55 text-olive-900 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
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
