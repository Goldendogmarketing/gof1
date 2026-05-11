"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ShoppingBag } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 800], [0, 130]);
  const copyY = useTransform(scrollY, [0, 600], [0, -64]);
  const opacity = useTransform(scrollY, [0, 620], [1, 0.35]);

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

      <motion.div
        className="pointer-events-none absolute left-[8%] top-[22%] hidden h-24 w-12 rounded-[100%] bg-olive-300/35 blur-[1px] md:block"
        animate={{ y: [0, -18, 0], rotate: [-16, 8, -16] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[24%] right-[18%] hidden h-20 w-10 rounded-[100%] bg-gold-400/25 blur-[1px] md:block"
        animate={{ y: [0, 20, 0], rotate: [20, -12, 20] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10 grid min-h-screen content-center pt-24">
        <motion.div style={{ y: copyY, opacity }} className="max-w-3xl space-y-8">
          <Image
            src="/brand/greek-olive-fusion-logo.png"
            alt="Greek Olive Fusion"
            width={280}
            height={86}
            priority
            className="w-56 bg-parchment/90 p-2 shadow-glow sm:w-72"
          />
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase text-gold-400">Greek groves. Modern infusions. One table.</p>
            <h1 className="max-w-3xl font-display text-5xl leading-tight text-balance sm:text-6xl lg:text-7xl">
              Premium olive oils shaped by harvest, cold press, and Mediterranean pairing.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-cream/82 sm:text-lg">
              Extra virgin Koroneiki olive oil and refined infusions inspired by Ariston Specialties, built for
              finishing, cooking, gifting, and sharing.
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
