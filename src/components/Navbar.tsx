"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/events", label: "Events" },
  { href: "/highlights", label: "Highlights" },
  { href: "/blogs", label: "Blogs" },
  { href: "/department", label: "CS Dept" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, signOut } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const onHero = pathname === "/";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  async function handleLogout() {
    try {
      await signOut();
      setOpen(false);
      toast.success("You have been logged out.");
      router.push("/");
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  }

  const text = onHero ? "text-white" : "text-ink-900";
  const base = `${text} text-sm font-semibold transition hover:text-brand-500`;

  return (
    <header className={`${onHero ? "absolute inset-x-0 top-0 z-50" : "sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur"}`}>
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Main">
        <Link href="/" aria-label="VSpark home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`${base} border-b-2 pb-1 ${isActive(l.href) ? "border-brand-500 text-brand-500" : "border-transparent"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className={base}>Dashboard{isAdmin ? " · Admin" : ""}</Link>
              <button onClick={handleLogout} className="btn-outline btn-sm">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={base}>Log in</Link>
              <Link href="/register" className="btn-primary btn-sm">
                Register Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        <button
          className={`${text} lg:hidden`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-ink-900"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-outline">Dashboard{isAdmin ? " · Admin" : ""}</Link>
                  <button onClick={handleLogout} className="btn-primary">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-outline">Log in</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary">Register Now</Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
