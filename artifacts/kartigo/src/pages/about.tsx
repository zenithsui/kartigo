import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShoppingBag, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4 text-center">
          <div className="container mx-auto max-w-3xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 kartigo-gradient rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
              About <span style={{ color: "#E8890C" }}>Karti</span><span style={{ color: "#2563EB" }}>go</span>
            </h1>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-4 text-left max-w-2xl mx-auto">
              <p className="text-center font-semibold text-xl text-foreground">Welcome to Kartigo!</p>
              <p>
                Hi, I'm Amit, the founder of Kartigo. Our goal is to make online shopping simple, affordable, and reliable. We carefully select quality products from trusted suppliers and deliver them directly to your doorstep through our dropshipping model.
              </p>
              <p>
                At Kartigo, we focus on providing a smooth shopping experience, competitive prices, and excellent customer support. Thank you for choosing us—we're excited to serve you!
              </p>
            </div>
          </div>
        </section>

        {/* Awards / Closing banner */}
        <section className="py-16 bg-primary text-primary-foreground px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Our Mission</h2>
            <p className="opacity-80 text-lg">
              Welcome to Kartigo! Founded by Amit, we're dedicated to bringing you trendy, quality products at great prices. With our dropshipping model, we make online shopping easy, secure, and hassle-free.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
