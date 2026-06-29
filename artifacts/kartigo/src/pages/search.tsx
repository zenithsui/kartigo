import { useEffect, useState } from "react";
import { useListProducts, useGetWishlist, getListProductsQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";

const trending = ["Saree", "iPhone", "Nike", "Laptop", "Kurti", "Watch", "Perfume", "Earphones"];

export default function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialQ = params.get("q") || "";
  const [query, setQuery] = useState(initialQ);

  const { data, isLoading } = useListProducts({ q: query || undefined, limit: 20, page: 1 }, { query: { enabled: !!query, queryKey: getListProductsQueryKey({ q: query || undefined, limit: 20, page: 1 }) } });
  const { data: wishlistItems = [] } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });
  const wishlistIds = new Set((wishlistItems as any[]).map((w) => w.productId));

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-2xl" data-testid="search-form">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="pl-10 pr-10 h-11"
              autoFocus
              data-testid="input-search-page"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="button-clear-search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="kartigo-gradient border-0" data-testid="button-search">Search</Button>
        </form>

        {!query && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Trending Searches</h2>
            <div className="flex flex-wrap gap-2" data-testid="trending-searches">
              {trending.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); setLocation(`/search?q=${encodeURIComponent(term)}`); }}
                  className="px-4 py-2 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-colors text-sm font-medium"
                  data-testid={`trending-${term}`}
                >
                  🔥 {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <div>
            {!isLoading && <p className="text-sm text-muted-foreground mb-4" data-testid="text-search-results">{total.toLocaleString()} results for "<strong>{query}</strong>"</p>}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center" data-testid="state-no-results">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="search-results-grid">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
