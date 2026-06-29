import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, TrendingUp, Shield, Zap, Users, BarChart2, Package, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApplyAsSeller } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";

const benefits = [
  { icon: Users, title: "50L+ Active Buyers", desc: "Reach millions of verified shoppers across 19,000+ cities in India." },
  { icon: TrendingUp, title: "Zero Listing Fee", desc: "List unlimited products for free. Pay only a small commission on sales you make." },
  { icon: Zap, title: "Same-Day Payouts", desc: "Earnings settled directly to your bank account within T+7 days of delivery." },
  { icon: Shield, title: "Seller Protection", desc: "Seller Shield covers you against fraudulent returns and payment disputes." },
  { icon: BarChart2, title: "Analytics Dashboard", desc: "Real-time sales, revenue charts, inventory alerts, and customer insights." },
  { icon: Package, title: "Fulfilment Support", desc: "Ship yourself or use Kartigo Fulfilment for warehousing, packing, and last-mile." },
];

const steps = [
  { step: "01", title: "Register", desc: "Fill in your business details, GST number, and bank account. Takes under 5 minutes." },
  { step: "02", title: "Get Verified", desc: "Our team verifies your documents within 3–5 business days. You'll get an email confirmation." },
  { step: "03", title: "List Products", desc: "Upload your product catalogue with images, prices, and descriptions using our bulk upload tool." },
  { step: "04", title: "Start Selling", desc: "Your products go live instantly. Receive orders, dispatch, and watch your earnings grow." },
];

const testimonials = [
  { name: "Suresh Kumar", city: "Pune", category: "Electronics Accessories", sales: "₹4.2L/month", quote: "Kartigo changed my business. I went from a local shop to serving customers across India." },
  { name: "Kavya Nair", city: "Kochi", category: "Handloom Sarees", sales: "₹1.8L/month", quote: "Their seller dashboard is incredible. I know exactly what's selling and when to restock." },
  { name: "Rajesh Agarwal", city: "Jaipur", category: "Handicrafts", sales: "₹2.5L/month", quote: "The fulfilment service saved me hours every day. Now I focus only on sourcing and growing." },
];

export default function SellOnKartigoPage() {
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();
  const applyAsSeller = useApplyAsSeller();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ storeName: "", storeSlug: "", gstNumber: "", description: "" });

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { login(); return; }
    const data = {
      storeName: form.storeName,
      storeSlug: form.storeSlug || form.storeName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      gstNumber: form.gstNumber,
      description: form.description,
    };
    applyAsSeller.mutate(
      { data },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({ title: "Application submitted!", description: "We'll review and get back to you within 3–5 business days." });
        },
        onError: () => toast({ title: "Something went wrong", description: "Please try again or contact support.", variant: "destructive" }),
      },
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">🚀 Join 5,000+ Sellers</span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
              Sell on <span className="text-yellow-300">Kartigo</span><br />Reach Crores of Buyers
            </h1>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              India's fastest-growing marketplace. Zero listing fees. Same-week payouts. A seller dashboard that actually helps you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#apply" className="bg-white text-primary font-bold px-8 py-4 rounded-xl text-lg hover:bg-white/90 transition-colors">
                Start Selling Today <ArrowRight className="inline w-5 h-5 ml-1" />
              </a>
              <a href="#how-it-works" className="border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors">
                How It Works
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-card border-b border-border px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { v: "50L+", l: "Active Buyers" },
                { v: "₹0", l: "Listing Fee" },
                { v: "T+7", l: "Payout Cycle" },
                { v: "19K+", l: "Cities Covered" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-bold text-primary mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{s.v}</div>
                  <div className="text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "Outfit, sans-serif" }}>Why Sell on Kartigo?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "Outfit, sans-serif" }}>How to Get Started</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">{s.step}</div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "Outfit, sans-serif" }}>Seller Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="p-6 bg-card border border-border rounded-xl">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
                  <div className="border-t border-border pt-3">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {t.city}</div>
                    <div className="text-sm font-bold text-green-600 mt-1">{t.sales}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply Form */}
        <section id="apply" className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-xl">
            <h2 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Start Your Seller Journey</h2>
            <p className="text-center text-muted-foreground mb-8">Fill in your details below and our team will reach out within 3–5 business days.</p>

            {submitted ? (
              <div className="bg-card border border-border rounded-2xl p-10 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Application Received!</h3>
                <p className="text-muted-foreground">Our seller onboarding team will review your application and contact you via email within 3–5 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store / Business Name *</Label>
                  <Input id="storeName" required placeholder="e.g. Raj Electronics" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number *</Label>
                  <Input id="gst" required placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">What will you sell? *</Label>
                  <Textarea id="desc" required rows={3} placeholder="Describe your products, categories, and approximate number of SKUs..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button type="submit" className="w-full kartigo-gradient border-0 h-12 text-base" disabled={applyAsSeller.isPending}>
                  {applyAsSeller.isPending ? "Submitting..." : "Submit Application →"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">By submitting, you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and Seller Agreement.</p>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
