import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using **Kartigo (kartigo.in)**, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use our website.`,
  },
  {
    title: "2. User Accounts",
    content: `To place orders, you may need to create an account. You agree to provide accurate and up-to-date information and keep your login details secure.

You are responsible for all activity under your account. If you suspect unauthorized access, contact us immediately at **karticocontact@gmail.com**.`,
  },
  {
    title: "3. Orders & Payments",
    content: `• All prices are displayed in **Indian Rupees (INR)**.
• Orders are confirmed only after successful payment or order confirmation for eligible payment methods.
• We reserve the right to cancel any order due to stock unavailability, pricing errors, suspected fraud, or other unforeseen circumstances. Any eligible payment made will be refunded.
• Payments are processed securely through trusted payment gateways.`,
  },
  {
    title: "4. Shipping & Returns",
    content: `We aim to dispatch orders as quickly as possible.

Eligible products can be returned within **7 days** of delivery, subject to our Return & Refund Policy. Returned items must be unused and in their original packaging.`,
  },
  {
    title: "5. Intellectual Property",
    content: `All content on Kartigo, including logos, text, images, graphics, and website design, belongs to Kartigo or its licensors and is protected by applicable intellectual property laws.

You may not copy, reproduce, or distribute any content without written permission.`,
  },
  {
    title: "6. Prohibited Use",
    content: `You agree not to:

• Use the website for any unlawful purpose.
• Attempt to hack, disrupt, or damage the website.
• Provide false information while placing orders.
• Copy or misuse our content without permission.
• Engage in fraudulent or abusive activities.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `Kartigo is not liable for indirect or consequential damages arising from the use of our website or products.

Our maximum liability for any claim will not exceed the amount paid for the relevant order.`,
  },
  {
    title: "8. Changes to Terms",
    content: `We may update these Terms of Service at any time. Updated terms will be posted on this page, and continued use of the website constitutes acceptance of the revised terms.`,
  },
  {
    title: "9. Governing Law",
    content: `These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the appropriate courts in India.`,
  },
  {
    title: "10. Contact Us",
    content: `If you have any questions regarding these Terms of Service, please contact us:

**Email:** karticocontact@gmail.com`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-muted/30 py-12 px-4 text-center border-b border-border">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Terms of Service</h1>
          </div>
        </section>
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
              <p className="text-sm text-amber-800">
                Please read these Terms of Service carefully before using Kartigo. By using our platform, you agree to be bound by these terms. Questions? <a href="/contact" className="underline">Contact us</a>.
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
