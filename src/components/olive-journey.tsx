"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { JourneySceneView } from "@/lib/types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export function OliveJourney({ scenes, compact = false }: { scenes: JourneySceneView[]; compact?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (compact || !rootRef.current || window.matchMedia("(max-width: 767px)").matches) return;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: `+=${scenes.length * 560}`,
        pin: ".journey-pin",
        scrub: 0.6,
        onUpdate: (self) => {
          const next = Math.min(scenes.length - 1, Math.floor(self.progress * scenes.length));
          setActive(next);
        }
      });

    }, rootRef);

    return () => context.revert();
  }, [compact, scenes.length]);

  return (
    <section ref={rootRef} className={cn("relative bg-olive-900 text-cream", compact ? "py-16" : "md:min-h-[460vh]")}>
      <div className={cn("journey-pin relative hidden overflow-hidden md:block", compact ? "" : "md:h-screen")}>
        <div className="absolute inset-0">
          {scenes.map((scene, index) => {
            const src = scene.imageUrl ?? "/journey/groves.svg";
            const isVideo = /\.(mp4|webm|mov)$/i.test(src);
            const layerClass = cn(
              "absolute inset-0 h-full w-full object-cover transition duration-700",
              index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
            );
            return isVideo ? (
              <video
                key={scene.id}
                src={src}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label={scene.title}
                className={layerClass}
              />
            ) : (
              <Image
                key={scene.id}
                src={src}
                alt={scene.title}
                fill
                sizes="100vw"
                className={cn(
                  "object-cover transition duration-700",
                  index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
                )}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-r from-olive-900/85 via-olive-900/55 to-olive-900/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-olive-900/70 via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 grid min-h-screen items-center py-20">
          <div className="max-w-xl space-y-8">
            <p className="text-sm font-semibold uppercase text-gold-400">Olive Journey</p>
            <div className="space-y-5">
              <span className="font-greek text-7xl text-gold-400/60 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                {scenes[active]?.stepLabel}
              </span>
              <p className="text-sm font-semibold uppercase text-cream/70">{scenes[active]?.eyebrow}</p>
              <h2 className="font-display text-4xl leading-tight text-balance drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl">
                {scenes[active]?.title}
              </h2>
              <p className="max-w-xl text-base leading-8 text-cream/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
                {scenes[active]?.body}
              </p>
            </div>
            <div className="hidden gap-2 md:flex">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === active ? "w-12 bg-gold-400" : "w-5 bg-cream/30"
                  )}
                  aria-label={`Show journey scene ${scene.stepLabel}`}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {scenes.map((scene) => {
          const src = scene.imageUrl ?? "/journey/groves.svg";
          const isVideo = /\.(mp4|webm|mov)$/i.test(src);
          return (
            <article key={scene.id} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
              <div className="absolute inset-0">
                {isVideo ? (
                  <video
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={scene.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={src}
                    alt={scene.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-olive-900 via-olive-900/70 to-olive-900/20" />
              </div>
              <div className="relative z-10 px-6 pb-12 pt-24">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gold-400">Olive Journey</p>
                <span className="font-greek text-6xl text-gold-400/70 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                  {scene.stepLabel}
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cream/70">{scene.eyebrow}</p>
                <h3 className="mt-3 font-display text-3xl leading-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)]">
                  {scene.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-cream/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
                  {scene.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
