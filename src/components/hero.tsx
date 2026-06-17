"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ShoppingBag } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  // Parallax + fade are purely decorative; when the user prefers reduced
  // motion we keep everything static (no scroll-linked transforms).
  const imageY = useTransform(scrollY, [0, 800], [0, prefersReducedMotion ? 0 : 130]);
  const copyY = useTransform(scrollY, [0, 600], [0, prefersReducedMotion ? 0 : -64]);
  const opacity = useTransform(scrollY, [0, 620], [1, prefersReducedMotion ? 1 : 0.35]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-olive-900 text-cream">
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <Image
          src="/brand/greek-olive-fusion-hero.png"
          alt="Greek Olive Fusion bottle in a Mediterranean olive grove"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-olive-900/85 via-olive-900/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-olive-900 via-transparent to-olive-900/20" />
      <div className="grain-overlay absolute inset-0 opacity-25" />

      <div className="container relative z-10 grid min-h-screen content-center pt-24">
        <motion.div style={{ y: copyY, opacity }} className="max-w-3xl space-y-8">
          <div className="space-y-5">
            <p className="inline-block rounded-sm bg-olive-900/55 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-gold-400 shadow-[0_1px_10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              Extra virgin Koroneiki olive oil from Messinia, Greece
            </p>
            <h1 className="max-w-3xl font-display text-5xl leading-tight text-balance drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl">
              Greek groves. Modern infusions. One table.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-cream/82 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:text-lg">
              Premium olive oils shaped by harvest, cold press, and Mediterranean pairing — extra virgin Koroneiki
              and refined infusions inspired by Ariston Specialties, built for finishing, cooking, gifting, and
              sharing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gold">
              <Link href="/shop">
                <ShoppingBag className="size-5" />
                Shop Olive Oils
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/#olive-journey">
                <ArrowDown className="size-5" />
                Explore the Journey
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
