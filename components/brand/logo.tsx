import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="transition-transform group-hover:scale-110">
        <defs>
          <linearGradient id="kg" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#3730A3" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>
        <path d="M6 9h3l2 12h12l3-8H12" stroke="url(#kg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="13" cy="25" r="2" fill="url(#kg)" />
        <circle cx="22" cy="25" r="2" fill="url(#kg)" />
      </svg>
      <span className={`font-heading font-bold ${sizes[size]} bg-gradient-to-r from-kartigo-indigo to-kartigo-coral bg-clip-text text-transparent`}>Kartigo</span>
    </Link>
  );
}
