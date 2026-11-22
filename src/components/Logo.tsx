export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="VSpark">
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
        <defs>
          <linearGradient id="vs-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path d="M4 6h8l8 17 8-17h8L24 36h-8z" fill="url(#vs-g)" />
        <path d="M14 6l6 12 6-12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      </svg>
      <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">VSPARK</span>
    </span>
  );
}
