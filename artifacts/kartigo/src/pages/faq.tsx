import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqs = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How do I track my order?", a: "Go to My Orders in your account and click on any order to see its current status — from placement through delivery." },
      { q: "How long does delivery take?", a: "Delivery typically takes 5–10 business days depending on your location and the supplier. You will receive a tracking update once your order is dispatched." },
      { q: "Can I change my delivery address after placing an order?", a: "Please contact us at karticocontact@gmail.com as soon as possible. We can try to update the address if the order hasn't been dispatched yet." },
      { q: "What happens if my package is lost or not delivered?", a: "If your order doesn't arrive within the expected timeframe, contact us at karticocontact@gmail.com and we will investigate and arrange a replacement or refund." },
      { q: "Do you offer Cash on Delivery?", a: "Yes, COD is available on eligible orders. You'll see the COD option at checkout if it's available for your PIN code." },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      { q: "What is Kartigo's return policy?", a: "Most products are eligible for a 7-day return from the date of delivery. The item must be unused, in its original packaging, with all accessories. Some items like personal care products and digital goods are non-returnable." },
      { q: "How do I initiate a return?", a: "Go to My Orders, select the delivered order, and click 'Return'. Choose the reason for the return. Our team will review and get back to you within 24–48 hours." },
      { q: "How long does a refund take?", a: "Once the returned item is received and inspected, refunds are processed within 5–7 business days to your original payment method." },
      { q: "What if I receive a damaged or wrong product?", a: "Please contact us at karticocontact@gmail.com within 48 hours of delivery with clear photos of the item. We will arrange a replacement or full refund promptly." },
      { q: "Is return shipping free?", a: "Return pickup is arranged by us for eligible returns. Please contact support to confirm availability for your area." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods does Kartigo accept?", a: "We accept UPI, Debit/Credit cards, Net Banking, Wallets, and Cash on Delivery (COD) on eligible orders." },
      { q: "Is my payment information secure?", a: "Yes. We use trusted, secure payment gateways. Your card details are never stored on our servers. All transactions are encrypted." },
      { q: "How do I apply a coupon code?", a: "Add items to your cart, go to the Cart page, and enter your coupon code in the 'Apply Coupon' box. The discount will reflect in your order total." },
      { q: "What should I do if my payment failed but money was deducted?", a: "Don't worry — failed payment deductions are automatically reversed within 3–5 business days. If it takes longer, please contact us at karticocontact@gmail.com with your transaction details." },
    ],
  },
  {
    category: "Account & Settings",
    items: [
      { q: "How do I create an account?", a: "Click 'Sign In' on the top right of the website and follow the prompts to register with your email address." },
      { q: "How do I update my profile information?", a: "Go to My Account and click Edit Profile to update your name, phone number, and delivery address." },
      { q: "How do I delete my account?", a: "To delete your account, please contact us at karticocontact@gmail.com. Account deletion is permanent and removes all order history and saved data." },
      { q: "I forgot my password. What should I do?", a: "Click 'Sign In' and then 'Forgot Password'. Enter your registered email address and follow the link sent to reset your password." },
    ],
  },
  {
    category: "Products & Shopping",
    items: [
      { q: "Are the products on Kartigo genuine?", a: "Yes. We source products from trusted suppliers and verify quality before listing. If you ever receive a product that doesn't match the description, contact us immediately for a resolution." },
      { q: "How does dropshipping work at Kartigo?", a: "When you place an order, we forward it to our trusted supplier who ships it directly to you. This keeps our prices competitive and our catalog wide." },
      { q: "Can I cancel my order?", a: "You can request a cancellation before the order is dispatched by contacting us at karticocontact@gmail.com. Once dispatched, you'll need to wait for delivery and then initiate a return." },
      { q: "How do I report an incorrect product listing?", a: "If you spot any inaccurate product information, please contact us at karticocontact@gmail.com and we'll review and update the listing promptly." },
      { q: "Do you restock sold-out items?", a: "Restocking depends on supplier availability. You can check back later or contact us to ask about a specific product." },
    ],
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const filtered = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg mb-8">Find answers to the most common questions about Kartigo.</p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl space-y-10">
            {filtered.map((cat) => (
              <div key={cat.category}>
                <h2 className="text-xl font-bold mb-4 text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>{cat.category}</h2>
                <div className="space-y-2">
                  {cat.items.map((item) => {
                    const key = `${cat.category}-${item.q}`;
                    const isOpen = openItem === key;
                    return (
                      <div key={item.q} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenItem(isOpen ? null : key)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium text-sm pr-4">{item.q}</span>
                          <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
                            <p className="pt-3">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-muted-foreground">No results for "{search}". Try a different search or <a href="/contact" className="text-primary hover:underline">contact us</a>.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-12 px-4 text-center">
          <div className="container mx-auto max-w-xl">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Still have questions?</h2>
            <p className="opacity-80 mb-6">Reach out to us anytime at karticocontact@gmail.com</p>
            <a href="/contact" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors">
              Contact Support →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
