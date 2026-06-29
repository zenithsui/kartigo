import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, make a purchase, write a review, or contact us for support.

**Personal Information:** Name, email address, phone number, delivery address, and payment method details (we never store full card numbers).

**Transaction Data:** Order history, products browsed, items added to cart or wishlist, and purchase amounts.

**Device & Usage Data:** IP address, browser type, operating system, referring URLs, pages visited, and time spent on the platform.

**Location Data:** PIN code entered for delivery estimates (not precise GPS unless you explicitly grant permission).`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

• Process and fulfil your orders
• Manage your account and provide customer support
• Send order updates and delivery notifications
• Personalise your shopping experience
• Process payments securely
• Detect and prevent fraud and security issues
• Comply with legal obligations
• Send promotional emails only if you opt in`,
  },
  {
    title: "3. Sharing of Information",
    content: `We do not sell your personal information.

We may share your information with:

• **Suppliers/Sellers** to fulfil your orders
• **Payment Processors** for secure payment processing
• **Delivery Partners** to deliver your orders
• **Government Authorities** if required by law`,
  },
  {
    title: "4. Data Security",
    content: `We use industry-standard security measures, including:

• SSL/TLS encryption
• Secure payment processing
• Restricted access to personal data
• Regular security monitoring

Although we take reasonable precautions, no online system is completely secure.`,
  },
  {
    title: "5. Cookies & Tracking",
    content: `We use cookies to:

• Keep you logged in
• Remember your cart and wishlist
• Improve website performance
• Personalise your shopping experience

You can disable cookies through your browser settings, although some features may not work properly.`,
  },
  {
    title: "6. Your Rights",
    content: `You have the right to:

• Access your personal information
• Correct inaccurate information
• Request deletion of your account
• Unsubscribe from promotional emails

To exercise these rights, contact us at:

**Email:** karticocontact@gmail.com`,
  },
  {
    title: "7. Data Retention",
    content: `We retain your information only as long as necessary to provide our services and comply with applicable laws.

After account deletion, certain records may be retained where legally required.`,
  },
  {
    title: "8. Returns Policy",
    content: `Kartigo offers a **7-Day Return Policy** on eligible products. Products must be returned in their original condition with all packaging and accessories. Certain items may not be eligible for return as mentioned on the product page.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Kartigo is not intended for children under the age of 13. We do not knowingly collect personal information from children.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated revision date. Continued use of our website means you accept the revised policy.`,
  },
  {
    title: "11. Contact Us",
    content: `For any privacy-related questions or concerns, contact us at:

**Email:** karticocontact@gmail.com`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-muted/30 py-12 px-4 text-center border-b border-border">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Privacy Policy</h1>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
              <p className="text-sm text-muted-foreground">
                At Kartigo, we take your privacy seriously. This policy explains what data we collect, how we use it, and what rights you have. If you have questions, <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </div>
            <div className="space-y-8">
              {sections.map((s) => (
                <div key={s.title}>
                  <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>{s.title}</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
