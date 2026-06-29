import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "karticocontact@gmail.com", sub: "We reply within 24 hours" },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Get in Touch</h1>
            <p className="text-muted-foreground text-lg">Have a question, feedback, or need help? We're here for you.</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Form */}
              <div className="bg-card border border-border rounded-2xl p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">Our support team will get back to you at <strong>{form.email}</strong> within 24 hours.</p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">Send Another Message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Send Us a Message</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" required placeholder="Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" required placeholder="rahul@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select onValueChange={(v) => setForm({ ...form, subject: v })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order Issue</SelectItem>
                          <SelectItem value="return">Return / Refund</SelectItem>
                          <SelectItem value="payment">Payment Problem</SelectItem>
                          <SelectItem value="product">Product Query</SelectItem>
                          <SelectItem value="seller">Seller Support</SelectItem>
                          <SelectItem value="account">Account Help</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" required rows={5} placeholder="Describe your issue or question in detail..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full kartigo-gradient border-0 h-11">Send Message</Button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Contact Information</h2>
                <div className="space-y-4">
                  {contactInfo.map((c) => (
                    <div key={c.label} className="flex gap-4 p-5 bg-card border border-border rounded-xl">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <c.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{c.label}</div>
                        <div className="font-semibold text-sm">{c.value}</div>
                        <div className="text-xs text-muted-foreground">{c.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h3 className="font-semibold mb-2">Quick Help</h3>
                  <p className="text-sm text-muted-foreground mb-3">For faster resolution, check our FAQ page first — most common issues are answered there.</p>
                  <a href="/faq" className="text-sm text-primary font-medium hover:underline">Visit FAQ →</a>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <h3 className="font-semibold mb-2 text-orange-800">Order-related queries?</h3>
                  <p className="text-sm text-orange-700 mb-3">For order tracking, cancellations, and returns, visit your Order History page for self-service options.</p>
                  <a href="/orders" className="text-sm text-orange-800 font-medium hover:underline">Go to My Orders →</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
