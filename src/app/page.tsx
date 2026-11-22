import Link from "next/link";
import { ArrowRight, ChevronDown, Code2, Gamepad2, Globe, Sparkles } from "lucide-react";
import { FEATURES } from "@/data/content";
import FeaturedCompetitions from "@/components/FeaturedCompetitions";

const ICONS = [Code2, Gamepad2, Globe, Sparkles];

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden bg-ink-900 text-white sm:min-h-[760px]">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url(/hero.svg)" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/40 to-slate-50" aria-hidden="true" />
        <div className="container-page relative z-10 pb-24 pt-28 text-center">
          <h1 className="text-6xl font-black tracking-tighter sm:text-8xl md:text-9xl">
            <span className="text-brand-500">V</span>SPARK
          </h1>
          <p className="mx-auto mt-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur sm:text-xs">
            National Innovation Event • COMSATS University Islamabad, Vehari
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium sm:text-xl">National-level coding competition and innovation showcase.</p>
          <p className="mx-auto mt-2 max-w-xl text-base text-brand-100 sm:text-lg">Speed programming, e-gaming, web dev, AI prompting and more.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base">Register Now</Link>
            <Link href="/events" className="btn-ghost-dark px-8 py-3.5 text-base">Explore Events</Link>
          </div>
        </div>
        <ChevronDown className="absolute bottom-6 left-1/2 z-10 h-6 w-6 -translate-x-1/2 animate-bounce text-ink-500" aria-hidden="true" />
      </section>

      <section className="container-page py-16">
        <div className="text-center">
          <span className="pill">What&apos;s inside</span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Compete. Build. <span className="text-brand-600">Spark.</span></h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <div key={f.title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-page pb-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="pill">Featured</span>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Competitions</h2>
          </div>
          <Link href="/competitions" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <FeaturedCompetitions />
      </section>

      <section className="container-page py-16">
        <div className="rounded-3xl bg-gradient-to-br from-ink-900 to-ink-700 px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold">Ready to take part?</h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-300">Create your account, pick your competitions and submit your payment proof. The VSpark team reviews every registration.</p>
          <Link href="/register" className="btn-primary mt-8 px-8 py-3.5">Register Now <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
