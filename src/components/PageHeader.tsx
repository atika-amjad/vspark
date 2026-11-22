import type { ReactNode } from "react";

export default function PageHeader({
  badge,
  title,
  accent,
  subtitle,
}: {
  badge: string;
  title: string;
  accent?: string;
  subtitle?: ReactNode;
}) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-slate-50 pb-10 pt-14 text-center">
      <div className="container-page">
        <span className="pill">{badge}</span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title} {accent && <span className="text-brand-600">{accent}</span>}
        </h1>
        {subtitle && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}
