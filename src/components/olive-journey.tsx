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

      gsap.fromTo(
        ".journey-orbit",
        { rotate: -14 },
        {
          rotate: 18,
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6
          }
        }
      );
    }, rootRef);

    return () => context.revert();
  }, [compact, scenes.length]);

  return (
    <section ref={rootRef} className={cn("relative bg-olive-900 text-cream", compact ? "py-16" : "md:min-h-[460vh]")}>
      <div className={cn("journey-pin overflow-hidden", compact ? "" : "md:h-screen")}>
        <div className="container grid min-h-screen items-center gap-10 py-20 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <p className="text-sm font-semibold uppercase text-gold-400">Olive Journey</p>
            <div className="space-y-5">
              <span className="font-greek text-7xl text-gold-400/45">{scenes[active]?.stepLabel}</span>
              <p className="text-sm font-semibold uppercase text-cream/55">{scenes[active]?.eyebrow}</p>
              <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl lg:text-6xl">
                {scenes[active]?.title}
              </h2>
              <p className="max-w-xl text-base leading-8 text-cream/75">{scenes[active]?.body}</p>
            </div>
            <div className="hidden gap-2 md:flex">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === active ? "w-12 bg-gold-400" : "w-5 bg-cream/20"
                  )}
                  aria-label={`Show journey scene ${scene.stepLabel}`}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="journey-orbit absolute -inset-10 rounded-full border border-gold-400/20" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-cream/10 shadow-glow">
              {scenes.map((scene, index) => (
                <Image
                  key={scene.id}
                  src={scene.imageUrl ?? "/journey/groves.svg"}
                  alt={scene.title}
                  fill
                  sizes="(min-width: 768px) 52vw, 100vw"
                  className={cn(
                    "object-cover transition duration-700",
                    index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container grid gap-4 pb-16 md:hidden">
        {scenes.map((scene) => (
          <article key={scene.id} className="rounded-md border border-white/10 bg-white/10 p-5">
            <span className="font-greek text-3xl text-gold-400">{scene.stepLabel}</span>
            <h3 className="mt-3 font-display text-3xl">{scene.title}</h3>
            <p className="mt-3 text-sm leading-7 text-cream/75">{scene.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
