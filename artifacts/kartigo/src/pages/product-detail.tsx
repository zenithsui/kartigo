import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct, useGetSimilarProducts, useGetProductReviews, useAddToCart, useAddToWishlist, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey, getGetProductReviewsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Heart, Star, Zap, Truck, RefreshCcw, Shield, Share2, Package, MapPin, ChevronDown, ChevronUp, Gift, Tag, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

const DELIVERY_DB: Record<string, { days: number; courier: string }> = {
  "110": { days: 2, courier: "Ekart Logistics" },
  "400": { days: 3, courier: "Delhivery" },
  "500": { days: 3, courier: "Bluedart" },
  "560": { days: 2, courier: "Ekart Logistics" },
  "600": { days: 3, courier: "Xpressbees" },
  "700": { days: 4, courier: "DTDC" },
  "380": { days: 3, courier: "Delhivery" },
  "302": { days: 4, courier: "India Post" },
};

function getDeliveryEstimate(pin: string): { days: number; courier: string } | null {
  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return null;
  const prefix = pin.slice(0, 3);
  return DELIVERY_DB[prefix] ?? { days: 5 + Math.floor(Math.random() * 3), courier: "India Post" };
}

function getDeliveryDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const OFFERS = [
  { icon: Tag, title: "Bank Offer", desc: "10% off on HDFC Bank Credit Cards. Min ₹3000", code: "HDFC10" },
  { icon: Tag, title: "Bank Offer", desc: "5% cashback on Axis Bank Debit Cards", code: "AXIS5" },
  { icon: Truck, title: "Free Delivery", desc: "Free delivery on orders above ₹499", code: null },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOR_OPTIONS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Red", hex: "#dc2626" },
  { name: "Green", hex: "#16a34a" },
];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [pinResult, setPinResult] = useState<{ days: number; courier: string } | null>(null);
  const [pinChecked, setPinChecked] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qaOpen, setQaOpen] = useState<number | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const { data: product, isLoading } = useGetProduct(slug);
  const { data: similar = [] } = useGetSimilarProducts(slug);
  const { data: reviewData } = useGetProductReviews({ productId: product?.id ?? 0 });
  const { data: wishlistItems = [] } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });

  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();

  const wishlistIds = new Set((wishlistItems as any[]).map((w) => w.productId));
  const isWishlisted = product ? wishlistIds.has(product.id) : false;

  function handleAddToCart() {
    if (!isAuthenticated) { login(); return; }
    addToCart.mutate(
      { data: { productId: product!.id, quantity: qty } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Added to cart!", description: `${qty}x ${product!.title}` });
        },
      },
    );
  }

  function handleBuyNow() {
    if (!isAuthenticated) { login(); return; }
    handleAddToCart();
    setLocation("/checkout");
  }

  function handleWishlist() {
    if (!isAuthenticated) { login(); return; }
    addToWishlist.mutate(
      { data: { productId: product!.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          toast({ title: isWishlisted ? "Removed from wishlist" : "Added to wishlist!" });
        },
      },
    );
  }

  function handleCheckPin() {
    const result = getDeliveryEstimate(pin);
    setPinResult(result);
    setPinChecked(true);
  }

  function handleShareAndEarn() {
    if (!isAuthenticated) { login(); return; }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const link = `${window.location.origin}/products/${slug}?ref=${code}`;
    setShareLink(link);
    navigator.clipboard.writeText(link).then(() => {
      toast({ title: "Share link copied! 🎉", description: "Share this link to earn commission on every sale." });
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="h-96 rounded-xl" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Link href="/products"><Button>Browse Products</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop"];
  const salePrice = (product as any).isFlashSale && (product as any).flashSalePrice ? (product as any).flashSalePrice : product.sellingPrice;
  const reviews = (reviewData as any)?.reviews ?? [];
  const breakdown = (reviewData as any)?.breakdown;
  const isFashion = ["fashion", "clothing", "footwear"].some((k) => product.description?.toLowerCase().includes(k) || (product as any).categoryName?.toLowerCase().includes(k));

  const faqs = [
    { q: "Is this product covered under warranty?", a: "Yes, this product comes with a 12-month manufacturer warranty. Defects due to manufacturing are covered. Physical damage is not covered under warranty." },
    { q: "Can I return this product?", a: "Yes, this product is eligible for 7-day returns from the date of delivery. The item must be unused and in original packaging." },
    { q: "Is Cash on Delivery available?", a: "COD is available for this product in most PIN codes. The option will appear during checkout if available for your location." },
    { q: "How long will delivery take?", a: "Standard delivery takes 3–7 business days. Enter your PIN code above to get an exact delivery estimate for your location." },
    { q: "Are the product images accurate?", a: "Yes, all product images are representative of the actual item. Minor colour variations may appear due to display settings." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
            <Link href="/" className="hover:text-primary" data-testid="breadcrumb-home">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary" data-testid="breadcrumb-products">Products</Link>
            {(product as any).categoryName && (
              <>
                <span>/</span>
                <Link href={`/categories`} className="hover:text-primary">{(product as any).categoryName}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground truncate max-w-48">{product.title}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            {/* Images */}
            <div className="space-y-4" data-testid="product-images">
              <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                />
                {product.discount > 0 && (
                  <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1.5 rounded-lg">
                    -{product.discount}% OFF
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${i === selectedImage ? "border-primary" : "border-border"}`}
                      data-testid={`button-image-thumb-${i}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4" data-testid="product-details">
              {(product as any).brandName && (
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">{(product as any).brandName}</p>
              )}
              <h1 className="text-2xl font-bold leading-snug" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-product-title">{product.title}</h1>

              {/* Rating */}
              {product.totalReviews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-green-600 text-white rounded-lg px-2 py-1">
                    <span className="font-bold text-sm">{product.averageRating.toFixed(1)}</span>
                    <Star className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">{product.totalReviews.toLocaleString()} ratings · {product.totalSold.toLocaleString()} sold</span>
                </div>
              )}

              <Separator />

              {/* Price */}
              <div className="flex items-baseline gap-3" data-testid="product-price">
                <span className="text-3xl font-bold text-foreground">{formatCurrency(salePrice)}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatCurrency(product.basePrice)}</span>
                    <Badge className="bg-primary text-primary-foreground" data-testid="badge-discount">{product.discount}% OFF</Badge>
                  </>
                )}
              </div>
              {(product as any).isFlashSale && (
                <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Flash Sale Price — Offer ends soon!</span>
                </div>
              )}

              {/* Variants — Size */}
              {isFashion && (
                <div>
                  <p className="text-sm font-semibold mb-2">Select Size:</p>
                  <div className="flex gap-2 flex-wrap">
                    {SIZE_OPTIONS.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz === selectedSize ? null : sz)}
                        className={`w-12 h-10 rounded-lg border-2 text-sm font-medium transition-all ${selectedSize === sz ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50"}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants — Color */}
              {isFashion && (
                <div>
                  <p className="text-sm font-semibold mb-2">Select Colour: {selectedColor && <span className="font-normal text-muted-foreground">{selectedColor}</span>}</p>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name === selectedColor ? null : c.name)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c.name ? "border-primary scale-110 ring-2 ring-primary ring-offset-1" : "border-border"}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Offers */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
                <p className="text-sm font-semibold flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Available Offers</p>
                {(showAllOffers ? OFFERS : OFFERS.slice(0, 2)).map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">{o.title}:</strong> {o.desc}{o.code && <> · Use code <span className="font-mono text-primary font-bold">{o.code}</span></>}</span>
                  </div>
                ))}
                <button onClick={() => setShowAllOffers(!showAllOffers)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  {showAllOffers ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />+{OFFERS.length - 2} more offers</>}
                </button>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                {product.stock > 10 ? (
                  <span className="text-green-600 font-medium">In Stock ({product.stock} units)</span>
                ) : product.stock > 0 ? (
                  <span className="text-orange-500 font-medium">Only {product.stock} left!</span>
                ) : (
                  <span className="text-destructive font-medium">Out of Stock</span>
                )}
              </div>

              {/* Qty + CTA */}
              {product.stock > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted text-foreground transition-colors" data-testid="button-qty-decrease">−</button>
                      <span className="px-4 py-2 font-semibold text-sm border-x border-border" data-testid="text-qty">{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-muted transition-colors" data-testid="button-qty-increase">+</button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={handleAddToCart}
                      disabled={addToCart.isPending}
                      data-testid="button-add-to-cart"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 kartigo-gradient border-0"
                      onClick={handleBuyNow}
                      data-testid="button-buy-now"
                    >
                      Buy Now
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="gap-2 w-full" onClick={handleWishlist} data-testid="button-wishlist">
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                      {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </Button>
                    <Button variant="outline" className="gap-2 w-full border-green-600 text-green-700 hover:bg-green-50" onClick={handleShareAndEarn} data-testid="button-share-earn">
                      <Share2 className="w-4 h-4" /> Share & Earn
                    </Button>
                  </div>
                  {shareLink && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-xs text-green-800 flex-1 truncate font-mono">{shareLink}</span>
                      <button onClick={() => { navigator.clipboard.writeText(shareLink); toast({ title: "Copied!" }); }} className="text-green-700 hover:text-green-900">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Truck, text: "Free delivery above ₹499" },
                  { icon: RefreshCcw, text: "7-day returns" },
                  { icon: Shield, text: "Secure payment" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 text-center">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* PIN code delivery estimate */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Check Delivery Date</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter PIN code"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinChecked(false); }}
                    maxLength={6}
                    className="flex-1"
                    data-testid="input-pin"
                  />
                  <Button variant="outline" size="sm" onClick={handleCheckPin} disabled={pin.length !== 6} data-testid="button-check-pin">
                    Check
                  </Button>
                </div>
                {pinChecked && pinResult && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Delivery by <strong>{getDeliveryDate(pinResult.days)}</strong> via {pinResult.courier}</span>
                  </div>
                )}
                {pinChecked && !pinResult && (
                  <p className="text-sm text-destructive">Please enter a valid 6-digit PIN code.</p>
                )}
              </div>

              {/* Seller */}
              {(product as any).sellerName && (
                <p className="text-sm text-muted-foreground">
                  Sold by:{" "}
                  <Link href={`/sellers/${(product as any).sellerName?.toLowerCase().replace(/\s+/g, "-")}`} className="text-primary font-medium hover:underline">
                    {(product as any).sellerName}
                  </Link>
                  {" · "}
                  <span className="text-green-600 font-medium">Verified Seller ✓</span>
                </p>
              )}
            </div>
          </div>

          {/* Tabs: Description, Reviews, Specs, Q&A */}
          <Tabs defaultValue="description" className="mb-12">
            <TabsList className="mb-4">
              <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({product.totalReviews})</TabsTrigger>
              <TabsTrigger value="specs" data-testid="tab-specs">Specifications</TabsTrigger>
              <TabsTrigger value="qa" data-testid="tab-qa">Q&amp;A ({faqs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">{(product as any).richDescription || product.description}</p>
            </TabsContent>

            <TabsContent value="reviews">
              {breakdown && (
                <div className="flex gap-8 mb-6 p-6 bg-card border border-border rounded-xl">
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-bold text-foreground" data-testid="text-avg-rating">{breakdown.average.toFixed(1)}</div>
                    <div className="flex justify-center my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(breakdown.average) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{breakdown.total} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-4 text-muted-foreground">{star}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <Progress
                          value={breakdown.total ? ((breakdown as any)[["zero","one","two","three","four","five"][star]] / breakdown.total) * 100 : 0}
                          className="flex-1 h-2"
                        />
                        <span className="w-8 text-right text-muted-foreground">{(breakdown as any)[["zero","one","two","three","four","five"][star]]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-4 border border-border rounded-xl" data-testid={`review-${review.id}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{review.userName}</span>
                          {review.isVerifiedPurchase && <Badge variant="outline" className="text-xs text-green-600 border-green-600">✓ Verified Purchase</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                          ))}
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        <p className="text-sm text-muted-foreground">{review.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs">
              {(product as any).specifications && Object.keys((product as any).specifications).length > 0 ? (
                <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                  <tbody>
                    {Object.entries((product as any).specifications).map(([key, val], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                        <td className="px-4 py-3 font-medium text-muted-foreground w-40">{key}</td>
                        <td className="px-4 py-3">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No specifications available.</p>
              )}
            </TabsContent>

            <TabsContent value="qa">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Frequently asked questions about this product. Have a question? <a href="/contact" className="text-primary hover:underline">Ask our support team →</a></p>
              </div>
              <div className="space-y-2">
                {faqs.map((item, idx) => (
                  <div key={idx} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQaOpen(qaOpen === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm pr-4">{item.q}</span>
                      {qaOpen === idx ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    </button>
                    {qaOpen === idx && (
                      <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border bg-muted/20 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Similar products */}
          {(similar as any[]).length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="section-similar">Similar Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(similar as any[]).slice(0, 5).map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
