import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  ["Shop", "/shop"],
  ["Olive Journey", "/olive-journey"],
  ["Pairings", "/pairings"],
  ["Wholesale", "/wholesale"],
  ["Contact", "/contact"],
  ["Admin", "/admin"]
];

export function Footer() {
  return (
    <footer className="border-t border-olive-900/10 bg-olive-900 text-cream">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md space-y-5">
          <Image src="/brand/greek-olive-fusion-logo.png" alt="Greek Olive Fusion" width={224} height={69} />
          <p className="text-sm leading-7 text-cream/75">
            Premium Greek extra virgin and infused olive oils built around aroma, texture, quality, and the ritual
            of a generous Mediterranean table.
          </p>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl">Explore</h2>
          <nav className="grid gap-3 text-sm text-cream/75" aria-label="Footer navigation">
            {footerLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl">Trade</h2>
          <p className="text-sm leading-7 text-cream/75">
            For restaurants, tasting rooms, specialty grocers, and gift programs, Greek Olive Fusion supports
            wholesale cases, bundles, and curated pairings.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream/55">
        © {new Date().getFullYear()} Greek Olive Fusion. Connected to Ariston Specialties.
      </div>
    </footer>
  );
}
