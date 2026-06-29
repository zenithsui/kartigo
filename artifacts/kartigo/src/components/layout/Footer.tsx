import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <img src="/logo.png" alt="Kartigo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
                <span style={{ color: "#E8890C" }}>Karti</span>
                <span style={{ color: "#2563EB" }}>go</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              India's favourite shopping destination. Fashion, Electronics, and more at the best prices.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-facebook"><Facebook className="w-5 h-5" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-twitter"><Twitter className="w-5 h-5" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors" data-testid="link-instagram"><Instagram className="w-5 h-5" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-destructive transition-colors" data-testid="link-youtube"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors" data-testid="footer-link-all-products">All Products</Link></li>
              <li><Link href="/products?flashSale=true" className="hover:text-secondary transition-colors" data-testid="footer-link-flash-sale">Flash Sale ⚡</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-primary transition-colors" data-testid="footer-link-featured">Featured</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-primary transition-colors" data-testid="footer-link-new">New Arrivals</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">All Categories</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/orders" className="hover:text-primary transition-colors" data-testid="footer-link-orders">Track Order</Link></li>
              <li><Link href="/profile" className="hover:text-primary transition-colors" data-testid="footer-link-profile">My Account</Link></li>
              <li><Link href="/return-policy" className="hover:text-primary transition-colors" data-testid="footer-link-returns">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors" data-testid="footer-link-contact">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Sell on Kartigo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sell-on-kartigo" className="hover:text-primary transition-colors" data-testid="footer-link-partner">Become a Seller</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-primary transition-colors" data-testid="footer-link-seller">Seller Dashboard</Link></li>
              <li><Link href="/sell-on-kartigo#reseller" className="hover:text-primary transition-colors" data-testid="footer-link-reseller">Reseller Program</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors" data-testid="footer-link-privacy">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors" data-testid="footer-link-terms">Terms of Service</Link></li>
              <li><Link href="/return-policy" className="hover:text-primary transition-colors">Return Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 Kartio. Made with ❤️ in India.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/return-policy" className="hover:text-primary transition-colors">Returns</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
