import { Link } from "wouter";
import { useGetFeaturedProducts, useGetFlashSaleProducts, useGetNewArrivals, useGetWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { ChevronRight, Zap, Star, ShieldCheck, Truck, RefreshCcw, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

const heroSlides = [
  {
    id: 1,
    title: "Season's Biggest Sale",
    subtitle: "Up to 80% off on Electronics, Fashion & More",
    cta: "Shop Now",
    href: "/products",
    bg: "from-primary to-purple-900",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Flash Sale Live ⚡",
    subtitle: "Limited time deals ending soon!",
    cta: "Grab Deals",
    href: "/products?flashSale=true",
    bg: "from-secondary to-orange-700",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    title: "New Arrivals",
    subtitle: "Fresh styles just dropped — shop the latest trends",
    cta: "Explore New",
    href: "/products?sort=newest",
    bg: "from-emerald-600 to-teal-700",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
  },
];

const categoryGrid = [
  { name: "Electronics", slug: "electronics", emoji: "📱", bg: "bg-blue-100", color: "text-blue-700" },
  { name: "Fashion", slug: "fashion", emoji: "👗", bg: "bg-pink-100", color: "text-pink-700" },
  { name: "Jerseys", slug: "jerseys", emoji: "👕", bg: "bg-amber-100", color: "text-amber-700" },
  { name: "Beauty", slug: "beauty", emoji: "💄", bg: "bg-rose-100", color: "text-rose-700" },
  { name: "Sports", slug: "sports", emoji: "⚽", bg: "bg-green-100", color: "text-green-700" },
  { name: "Books", slug: "books", emoji: "📚", bg: "bg-indigo-100", color: "text-indigo-700" },
  { name: "Toys", slug: "toys", emoji: "🧸", bg: "bg-yellow-100", color: "text-yellow-700" },
  { name: "Grocery", slug: "grocery", emoji: "🛒", bg: "bg-lime-100", color: "text-lime-700" },
];

const features = [
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499" },
  { icon: RefreshCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% safe & secure" },
  { icon: Headphones, title: "24/7 Support", desc: "Always here for you" },
];

function FlashSaleTimer() {
  const [time, setTime] = useState({ h: 5, m: 30, s: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-white">
      <span className="text-xs opacity-80 mr-1">Ends in:</span>
      {[time.h, time.m, time.s].map((unit, i) => (
        <span key={i} className="flex items-center">
          <span className="bg-white/20 rounded px-1.5 py-0.5 font-mono font-bold text-sm">{pad(unit)}</span>
          {i < 2 && <span className="mx-0.5 font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [heroIdx, setHeroIdx] = useState(0);

  const { data: featured = [], isLoading: featuredLoading } = useGetFeaturedProducts();
  const { data: flashSale = [], isLoading: flashLoading } = useGetFlashSaleProducts();
  const { data: newArrivals = [], isLoading: arrivalsLoading } = useGetNewArrivals();
  const { data: wishlistItems = [] } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });

  const wishlistIds = new Set((wishlistItems as any[]).map((w) => w.productId));

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[heroIdx];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Slider */}
        <section className={`bg-gradient-to-r ${slide.bg} text-white relative overflow-hidden`} data-testid="section-hero">
          <div className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 min-h-[380px]">
            <div className="flex-1 space-y-4">
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">New Season</Badge>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-hero-title">
                {slide.title}
              </h1>
              <p className="text-white/80 text-lg">{slide.subtitle}</p>
              <div className="flex gap-3 pt-2">
                <Link href={slide.href} data-testid="button-hero-cta">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                    {slide.cta} <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/products" data-testid="button-hero-explore">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Explore All
                  </Button>
                </Link>
              </div>
              {/* Slide indicators */}
              <div className="flex gap-2 pt-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-8 bg-white" : "w-4 bg-white/40"}`}
                    data-testid={`button-hero-slide-${i}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 hidden md:block">
              <img
                src={slide.image}
                alt={slide.title}
                className="rounded-2xl object-cover w-full max-h-64 shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features bar */}
        <section className="bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3" data-testid={`feature-${i}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category grid */}
        <section className="container mx-auto px-4 py-10" data-testid="section-categories">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Shop by Category</h2>
            <Link href="/categories" className="text-primary text-sm font-medium hover:underline" data-testid="link-view-all-categories">View All</Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categoryGrid.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} data-testid={`link-category-grid-${cat.slug}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:shadow-md transition-all cursor-pointer group">
                  <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {cat.emoji}
                  </div>
                  <span className={`text-xs font-medium ${cat.color} text-center leading-tight`}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Flash Sale */}
        {(flashLoading || (flashSale as any[]).length > 0) && (
          <section className="bg-gradient-to-r from-secondary to-orange-600 py-8" data-testid="section-flash-sale">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Flash Sale</h2>
                  <FlashSaleTimer />
                </div>
                <Link href="/products?flashSale=true" className="text-white/80 hover:text-white text-sm font-medium" data-testid="link-view-all-flash">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {flashLoading
                  ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
                  : (flashSale as any[]).slice(0, 6).map((product: any) => (
                      <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} compact />
                    ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-10" data-testid="section-featured">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Featured Products</h2>
              <p className="text-muted-foreground text-sm">Handpicked just for you</p>
            </div>
            <Link href="/products?featured=true" className="text-primary text-sm font-medium hover:underline" data-testid="link-view-all-featured">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredLoading
              ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
              : (featured as any[]).slice(0, 10).map((product: any) => (
                  <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                ))}
          </div>
        </section>

        {/* Promotional banner */}
        <section className="container mx-auto px-4 py-4" data-testid="section-promo-banner">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-primary to-purple-700 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Become a Seller</p>
                <h3 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Sell on Kartigo</h3>
                <p className="text-sm opacity-80 mt-1">Reach millions of customers across India</p>
                <Link href="/sell-on-kartigo" data-testid="banner-link-sell">
                  <Button size="sm" className="mt-3 bg-white text-primary hover:bg-white/90 text-xs">Start Selling</Button>
                </Link>
              </div>
              <div className="text-5xl">🏪</div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Reseller Program</p>
                <h3 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Resell & Earn</h3>
                <p className="text-sm opacity-80 mt-1">Share products, earn commissions</p>
                <Link href="/sell-on-kartigo#reseller" data-testid="banner-link-resell">
                  <Button size="sm" className="mt-3 bg-white text-emerald-700 hover:bg-white/90 text-xs">Learn More</Button>
                </Link>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="container mx-auto px-4 py-10" data-testid="section-new-arrivals">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>New Arrivals</h2>
              <p className="text-muted-foreground text-sm">Fresh drops every day</p>
            </div>
            <Link href="/products?sort=newest" className="text-primary text-sm font-medium hover:underline" data-testid="link-view-all-new">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {arrivalsLoading
              ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
              : (newArrivals as any[]).slice(0, 10).map((product: any) => (
                  <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
