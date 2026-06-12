"use client";

import * as React from "react";
import Image from "next/image";

type GalleryImage = { url: string; alt: string };

type Props = {
  images: GalleryImage[];
  fallbackImage: string;
  productTitle: string;
};

export function ProductGallery({ images, fallbackImage, productTitle }: Props) {
  const slides: GalleryImage[] = images.length
    ? images
    : [{ url: fallbackImage, alt: productTitle }];

  const [activeIndex, setActiveIndex] = React.useState(0);
  const active = slides[Math.min(activeIndex, slides.length - 1)];

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-cream shadow-soft">
        <Image
          key={active.url}
          src={active.url}
          alt={active.alt || productTitle}
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover"
        />
      </div>

      {slides.length > 1 ? (
        <div
          className="grid grid-cols-4 gap-2 sm:grid-cols-5"
          role="tablist"
          aria-label={`${productTitle} image gallery`}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${slide.url}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${idx + 1} of ${slides.length}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative aspect-square overflow-hidden rounded-sm bg-cream transition ${
                  isActive
                    ? "ring-2 ring-olive-700 ring-offset-2 ring-offset-cream"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={slide.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
