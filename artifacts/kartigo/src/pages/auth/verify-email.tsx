import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const KARTIGO_ORANGE = "#E8890C";
const KARTIGO_INDIGO = "#2563EB";

type State = "loading" | "success" | "error" | "expired" | "resent";

export default function VerifyEmailPage() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success") === "true";
  const error = params.get("error") ?? "";
  const [state, setState] = useState<State>(success ? "success" : error ? (error === "expired" ? "expired" : "error") : "loading");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (success) {
      setState("success");
      setTimeout(() => { window.location.href = "/"; }, 3000);
    } else if (error) {
      setState(error === "expired" ? "expired" : "error");
    }
  }, []);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      setState("resent");
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="font-bold text-3xl" style={{ fontFamily: "Outfit, sans-serif" }}>
              <span style={{ color: KARTIGO_ORANGE }}>Karti</span>
              <span style={{ color: KARTIGO_INDIGO }}>go</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-border p-10 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold">Verifying your email…</h2>
            </>
          )}

          {state === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Email verified! 🎉</h2>
              <p className="text-muted-foreground text-sm mb-6">Your account is active. Redirecting you to the homepage…</p>
              <Link href="/">
                <Button
                  className="w-full h-11 font-semibold border-0"
                  style={{ background: `linear-gradient(135deg, ${KARTIGO_ORANGE} 0%, #d97706 100%)` }}
                  onClick={() => window.location.href = "/"}
                >
                  Start Shopping
                </Button>
              </Link>
            </>
          )}

          {state === "expired" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Link expired</h2>
              <p className="text-muted-foreground text-sm mb-6">This verification link has expired. Enter your email to get a new one.</p>
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Button
                  type="submit"
                  disabled={resending}
                  className="w-full font-semibold border-0"
                  style={{ background: `linear-gradient(135deg, ${KARTIGO_ORANGE} 0%, #d97706 100%)` }}
                >
                  {resending ? "Sending…" : "Resend Verification Email"}
                </Button>
              </form>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Invalid link</h2>
              <p className="text-muted-foreground text-sm mb-6">This verification link is invalid or has already been used.</p>
              <Link href="/auth/login">
                <Button className="w-full font-semibold kartigo-gradient border-0">Go to Login</Button>
              </Link>
            </>
          )}

          {state === "resent" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Email sent!</h2>
              <p className="text-muted-foreground text-sm">Check your inbox for the new verification link.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
