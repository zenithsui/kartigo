import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn, Sparkles, CheckCircle2, ShoppingBag } from "lucide-react";

const KARTIGO_ORANGE = "#E8890C";
const KARTIGO_INDIGO = "#2563EB";

function getReturnTo(): string {
  const params = new URLSearchParams(window.location.search);
  const r = params.get("returnTo");
  if (r && r.startsWith("/") && !r.startsWith("//")) return r;
  return "/";
}

const URL_ERROR_MAP: Record<string, string> = {
  "invalid-link": "This magic link is invalid or has already been used.",
  "link-expired": "This magic link has expired. Please request a new one.",
  "missing-token": "No login token found in the link.",
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"password" | "magic">("password");

  // Password form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  // Magic link
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const urlError = new URLSearchParams(window.location.search).get("error") ?? "";

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  function startCooldown() {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current!); return 0; } return c - 1; });
    }, 1000);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!email.trim() || !password) { setPwError("Please enter your email and password."); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Login failed. Please try again.");
      } else {
        window.location.href = getReturnTo();
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    if (!magicEmail.trim()) { setMagicError("Please enter your email address."); return; }
    setMagicLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: magicEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setMagicError(data.error ?? "Failed to send magic link."); }
      else { setMagicSent(true); startCooldown(); }
    } catch {
      setMagicError("Network error. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setMagicLoading(true);
    const res = await fetch("/api/auth/magic-link/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: magicEmail.trim() }),
    }).catch(() => null);
    if (res?.ok) startCooldown();
    setMagicLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "linear-gradient(180deg, #b8dff5 0%, #d6ecf8 40%, #e8f4fb 70%, #f0f7ff 100%)" }}>
      {/* Decorative arc rings — same as reference */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
        <circle cx="720" cy="900" r="420" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <circle cx="720" cy="900" r="560" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="720" cy="900" r="700" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      </svg>

      {/* Cloud shapes */}
      <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 280" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="160" cy="230" rx="200" ry="80" fill="white" opacity="0.7" />
        <ellipse cx="100" cy="260" rx="160" ry="60" fill="white" opacity="0.85" />
        <ellipse cx="1300" cy="220" rx="220" ry="90" fill="white" opacity="0.65" />
        <ellipse cx="1360" cy="255" rx="160" ry="60" fill="white" opacity="0.8" />
        <ellipse cx="750" cy="270" rx="280" ry="70" fill="white" opacity="0.5" />
      </svg>

      {/* Logo top-left */}
      <div className="relative z-10 p-6">
        <Link href="/">
          <span className="font-extrabold text-2xl" style={{ fontFamily: "Outfit, sans-serif" }}>
            <span style={{ color: KARTIGO_ORANGE }}>Karti</span><span style={{ color: KARTIGO_INDIGO }}>go</span>
          </span>
        </Link>
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-200/60 border border-white/80 px-8 py-9">

          {/* Mode icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: mode === "password" ? "linear-gradient(135deg,#f0f4ff,#e8eeff)" : "linear-gradient(135deg,#fff8ed,#ffefd5)" }}>
              {mode === "password"
                ? <ShoppingBag className="w-7 h-7" style={{ color: KARTIGO_INDIGO }} />
                : <Sparkles className="w-7 h-7" style={{ color: KARTIGO_ORANGE }} />}
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
            {mode === "password" ? "Sign in to Kartigo" : "Magic link login"}
          </h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            {mode === "password"
              ? "Shop smarter, find better deals."
              : "We'll email you a one-click sign-in link."}
          </p>

          {/* URL-level error */}
          {urlError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm mb-4">
              {URL_ERROR_MAP[urlError] ?? "Something went wrong."}
            </div>
          )}

          {/* ── Password form ── */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 bg-gray-100/80 rounded-xl px-4 h-12">
                <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-3 bg-gray-100/80 rounded-xl px-4 h-12">
                <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600">
                  {showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs font-medium hover:underline" style={{ color: KARTIGO_INDIGO }}>
                  Forgot password?
                </Link>
              </div>

              {pwError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
                  {pwError}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full h-12 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
              >
                {pwLoading ? "Signing in…" : "Get Started →"}
              </button>
            </form>
          )}

          {/* ── Magic link form ── */}
          {mode === "magic" && !magicSent && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-100/80 rounded-xl px-4 h-12">
                <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                <input
                  type="email"
                  placeholder="Email"
                  value={magicEmail}
                  onChange={e => setMagicEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                  autoComplete="email"
                  required
                />
              </div>

              {magicError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
                  {magicError}
                </div>
              )}

              <button
                type="submit"
                disabled={magicLoading}
                className="w-full h-12 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
              >
                {magicLoading ? "Sending…" : "Send Magic Link →"}
              </button>
            </form>
          )}

          {/* ── Magic link sent ── */}
          {mode === "magic" && magicSent && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Check your inbox!</p>
                <p className="text-xs text-gray-500 mt-1">Sent to <strong>{magicEmail}</strong> · expires in 15 min</p>
              </div>
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || magicLoading}
                className="w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
              </button>
              <button onClick={() => { setMagicSent(false); setMagicEmail(""); }} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Use a different email
              </button>
            </div>
          )}

          {/* ── Divider + alternative method ── */}
          {!(mode === "magic" && magicSent) && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-dashed border-gray-300" />
                <span className="text-xs text-gray-400">Or sign in with</span>
                <div className="flex-1 border-t border-dashed border-gray-300" />
              </div>

              {mode === "password" ? (
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setPwError(""); }}
                  className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition text-sm font-medium text-gray-700"
                >
                  <Sparkles className="w-4 h-4" style={{ color: KARTIGO_ORANGE }} />
                  Magic Link (no password)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode("password"); setMagicError(""); }}
                  className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition text-sm font-medium text-gray-700"
                >
                  <LogIn className="w-4 h-4" style={{ color: KARTIGO_INDIGO }} />
                  Password login
                </button>
              )}
            </>
          )}

          {/* Footer links */}
          <p className="text-center text-xs text-gray-400 mt-6">
            New to Kartigo?{" "}
            <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: KARTIGO_INDIGO }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
