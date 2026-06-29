import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CheckCircle, XCircle, RefreshCcw, Clock } from "lucide-react";

const nonReturnable = [
  "Personal care and hygiene products that have been opened",
  "Food and grocery items",
  "Gift cards and digital products",
  "Customized or personalized products",
  "Items marked 'Non-Returnable' on the product page",
];

const steps = [
  { icon: RefreshCcw, step: "1", title: "Request a Return", desc: "Log in to your account, go to My Orders, select the order, and click Return. Choose the reason and upload photos if the product is damaged or incorrect." },
  { icon: CheckCircle, step: "2", title: "Return Review", desc: "Our support team will review your request. If approved, we'll provide return instructions or arrange a pickup where available." },
  { icon: CheckCircle, step: "3", title: "Return the Item", desc: "The product must be unused, in its original packaging, and include all accessories, manuals, and tags." },
  { icon: Clock, step: "4", title: "Refund", desc: "Once the returned item is received and passes inspection, your refund will be processed within 5–7 business days to your original payment method." },
];

const refundTimelines = [
  { method: "UPI", time: "1–3 Business Days" },
  { method: "Debit/Credit Card", time: "5–7 Business Days" },
  { method: "Net Banking", time: "3–5 Business Days" },
  { method: "Cash on Delivery", time: "Bank Transfer (5–7 Business Days)" },
];

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-green-50 to-background py-16 px-4 text-center border-b border-border">
          <div className="container mx-auto max-w-2xl">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCcw className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Return & Refund Policy</h1>
            <p className="text-muted-foreground text-lg">Shop with confidence at <strong>Kartigo</strong>.</p>
          </div>
        </section>

        {/* Highlight */}
        <section className="py-10 px-4 bg-green-600 text-white text-center">
          <div className="container mx-auto">
            <p className="text-xl font-semibold">✅ 7-Day Easy Returns on eligible products</p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Outfit, sans-serif" }}>How Returns Work</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <s.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Step {s.step}</div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Eligibility */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Return Eligibility</h2>
            <p className="text-muted-foreground mb-4">Eligible products can be returned within <strong>7 days</strong> of delivery if they are:</p>
            <div className="space-y-2">
              {[
                "Unused and in original condition",
                "Returned with original packaging and accessories",
                "Not damaged by misuse",
                "Eligible for return as mentioned on the product page",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Non-returnable */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Non-Returnable Items</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {nonReturnable.map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Damaged / Wrong */}
        <section className="py-10 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Damaged or Wrong Product</h2>
            <p className="text-muted-foreground">
              If you receive a damaged, defective, or incorrect item, please contact us within <strong>48 hours of delivery</strong> with clear photos. We will review your request and arrange a replacement or refund if approved.
            </p>
          </div>
        </section>

        {/* Refund timelines */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Refund Timeline</h2>
            <div className="space-y-3">
              {refundTimelines.map((r) => (
                <div key={r.method} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <span className="font-medium text-sm">{r.method}</span>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.time}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">Refund processing begins after the returned product has been received and successfully inspected.</p>
          </div>
        </section>

        {/* Contact */}
        <section className="py-10 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Contact Us</h2>
            <p className="text-muted-foreground">For return or refund assistance, contact us at: <a href="mailto:karticocontact@gmail.com" className="text-primary font-medium hover:underline">karticocontact@gmail.com</a></p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 text-center">
          <div className="container mx-auto max-w-xl">
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Need to return an item?</h2>
            <p className="text-muted-foreground mb-6">Go to your orders and initiate a return in seconds.</p>
            <a href="/orders" className="inline-flex items-center gap-2 kartigo-gradient text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
              Go to My Orders →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
