import Link from "next/link";
import { Globe, MapPin, Phone, Mail } from "lucide-react";
import Logo from "./Logo";

const QUICK = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/events", label: "Events" },
  { href: "/highlights", label: "Highlights" },
  { href: "/blogs", label: "Blogs" },
  { href: "/department", label: "CS Department" },
  { href: "/universities", label: "Universities" },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink-900 text-ink-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            COMSATS University Islamabad, Vehari Campus — CS Department&apos;s premier national-level innovation event. Connecting minds and shaping the future.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {QUICK.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-400" /> CUI Vehari, Punjab, Pakistan</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-400" /> hodcs@cuivehari.edu.pk</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-400" /> (067) 3602803</li>
            <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-brand-400" /> ww2.comsats.edu.pk/cs_vhr</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} VSpark — COMSATS University Islamabad, Vehari Campus.</p>
          <Link href="/admin" className="hover:text-white">Admin Panel</Link>
        </div>
      </div>
    </footer>
  );
}
