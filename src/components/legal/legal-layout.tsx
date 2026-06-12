import * as React from "react";

type Props = {
  title: string;
  eyebrow?: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, eyebrow = "Policy", lastUpdated, children }: Props) {
  return (
    <main className="px-5 pb-24 pt-28 lg:pt-[180px]">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-olive-900/10 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase text-gold-600">{eyebrow}</p>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-ink/55">Last updated: {lastUpdated}</p>
        </header>
        <div className="space-y-5 text-ink/80 leading-7">{children}</div>
      </article>
    </main>
  );
}
