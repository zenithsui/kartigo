import { useState } from "react";
import { useLocation } from "wouter";
import { useListProducts, useGetWishlist, getListProductsQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";

interface ProductListingProps {
  category?: string;
  title: string;
  icon?: string;
  description?: string;
  flashSale?: boolean;
  featured?: boolean;
}

export default function ProductListing({ category, title, icon, description, flashSale, featured }: ProductListingProps) {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const q = params.get("q") || undefined;
  const brand = params.get("brand") || undefined;

  const { isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [ratings, setRatings] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const activeFilters: string[] = [];
  if (priceRange[0] > 0 || priceRange[1] < 200000) activeFilters.push(`₹${priceRange[0].toLocaleString()}–₹${priceRange[1].toLocaleString()}`);
  if (ratings.length) activeFilters.push(`${Math.min(...ratings)}★ & above`);
  if (inStockOnly) activeFilters.push("In Stock");

  function clearFilters() {
    setPriceRange([0, 200000]);
    setRatings([]);
    setInStockOnly(false);
    setPage(1);
  }

  const { data, isLoading } = useListProducts(
    {
      q,
      category,
      brand,
      featured,
      flashSale,
      sort,
      page,
      limit: 20,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
    },
    { query: { queryKey: getListProductsQueryKey({ q, category, brand, sort, page, limit: 20 }) } },
  );

  const { data: wishlistItems = [] } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });
  const wishlistIds = new Set((wishlistItems as any[]).map((w) => w.productId));

  const allProducts = data?.products ?? [];
  const products = inStockOnly ? allProducts.filter((p: any) => p.stock > 0) : allProducts;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const FiltersContent = () => (
    <div className="space-y-6">
      {activeFilters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Active Filters</h4>
            <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-3 text-sm">Price Range</h4>
        <Slider
          min={0}
          max={200000}
          step={500}
          value={priceRange}
          onValueChange={(v) => { setPriceRange(v); setPage(1); }}
          className="mb-3"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[[0, 1000], [1000, 5000], [5000, 20000], [20000, 200000]].map(([mn, mx]) => (
            <button
              key={`${mn}-${mx}`}
              onClick={() => { setPriceRange([mn, mx]); setPage(1); }}
              className={`text-xs py-1.5 px-2 rounded-lg border transition-colors ${priceRange[0] === mn && priceRange[1] === mx ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
            >
              {mn === 0 ? "Under" : `₹${(mn / 1000).toFixed(0)}k`}–{mx === 200000 ? "200k+" : `₹${(mx / 1000).toFixed(0)}k`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Customer Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${r}`}
                checked={ratings.includes(r)}
                onCheckedChange={(checked) => {
                  setRatings(checked ? [...ratings, r] : ratings.filter((x) => x !== r));
                  setPage(1);
                }}
              />
              <Label htmlFor={`rating-${r}`} className="text-sm cursor-pointer flex items-center gap-1">
                {"★".repeat(r)}<span className="text-muted-foreground">&amp; above</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Availability</h4>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(v) => { setInStockOnly(!!v); setPage(1); }}
          />
          <Label htmlFor="in-stock" className="text-sm cursor-pointer">In Stock Only</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                {icon && <span>{icon}</span>}
                {title}
              </h1>
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-1">
                  {total.toLocaleString()} product{total !== 1 ? "s" : ""} found
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Filter className="w-4 h-4 mr-1" /> Filter
                    {activeFilters.length > 0 && (
                      <Badge className="ml-1 h-4 w-4 p-0 text-xs">{activeFilters.length}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="w-44">
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

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((f) => (
                <Badge key={f} variant="outline" className="text-xs gap-1">
                  {f}
                  <button onClick={clearFilters} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                </Badge>
              ))}
              <button onClick={clearFilters} className="text-xs text-destructive hover:underline">Clear all</button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters — desktop */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              <FiltersContent />
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
                {activeFilters.length > 0 && (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={p === page ? "kartigo-gradient border-0" : ""}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
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
