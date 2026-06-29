import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts, useGetWishlist, getListProductsQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { Label } from "@/components/ui/label";

export default function ProductsPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const { isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("popular");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [ratings, setRatings] = useState<number[]>([]);

  const category = params.get("category") || undefined;
  const brand = params.get("brand") || undefined;
  const q = params.get("q") || undefined;
  const featured = params.get("featured") === "true" ? true : undefined;
  const flashSale = params.get("flashSale") === "true" ? true : undefined;

  const { data, isLoading } = useListProducts({
    q,
    category,
    brand,
    featured,
    flashSale,
    sort,
    page,
    limit: 20,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
  }, { query: { queryKey: getListProductsQueryKey({ q, category, brand, sort, page, limit: 20 }) } });

  const { data: wishlistItems = [] } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });
  const wishlistIds = new Set((wishlistItems as any[]).map((w) => w.productId));

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const title = q ? `Results for "${q}"` : category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ") : featured ? "Featured Products" : flashSale ? "⚡ Flash Sale" : "All Products";

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3 text-sm">Price Range</h4>
        <Slider
          min={0}
          max={100000}
          step={500}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
          data-testid="slider-price"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${r}`}
                checked={ratings.includes(r)}
                onCheckedChange={(checked) =>
                  setRatings(checked ? [...ratings, r] : ratings.filter((x) => x !== r))
                }
                data-testid={`checkbox-rating-${r}`}
              />
              <Label htmlFor={`rating-${r}`} className="text-sm cursor-pointer">{"★".repeat(r)} & above</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-page-title">{title}</h1>
            {!isLoading && <p className="text-sm text-muted-foreground">{total.toLocaleString()} products found</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden" data-testid="button-mobile-filter">
                  <Filter className="w-4 h-4 mr-1" /> Filter
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Filters />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sort} onValueChange={setSort} data-testid="select-sort">
              <SelectTrigger className="w-40">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden md:block w-56 shrink-0" data-testid="sidebar-filters">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              <Filters />
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="state-empty">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="product-grid">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8" data-testid="pagination">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="button-prev-page">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        data-testid={`button-page-${p}`}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} data-testid="button-next-page">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
