import { useGetCart, useUpdateCartItem, useRemoveCartItem, useApplyCoupon, useRemoveCoupon, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, Tag, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function CartPage() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [couponCode, setCouponCode] = useState("");

  const { data: cart, isLoading } = useGetCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  function invalidateCart() {
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
  }

  function handleQtyChange(itemId: number, newQty: number) {
    updateItem.mutate({ data: { itemId, quantity: newQty } }, { onSuccess: invalidateCart });
  }

  function handleRemove(itemId: number) {
    removeItem.mutate({ itemId }, { onSuccess: invalidateCart });
  }

  function handleApplyCoupon() {
    applyCoupon.mutate(
      { data: { code: couponCode } },
      {
        onSuccess: () => { invalidateCart(); toast({ title: "Coupon applied!" }); },
        onError: () => toast({ title: "Invalid coupon", variant: "destructive" }),
      },
    );
  }

  function handleRemoveCoupon() {
    removeCoupon.mutate(undefined, { onSuccess: invalidateCart });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Sign in to view your cart</p>
          <Button onClick={login} className="kartigo-gradient border-0" data-testid="button-login-cart">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-cart-title">
          Shopping Cart {!isLoading && <span className="text-muted-foreground font-normal text-lg">({items.length} items)</span>}
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="state-empty-cart">
            <ShoppingBag className="w-20 h-20 text-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet</p>
            <Link href="/products"><Button className="kartigo-gradient border-0" data-testid="button-shop-now">Shop Now</Button></Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4 bg-card border border-border rounded-xl" data-testid={`cart-item-${item.id}`}>
                  <img
                    src={item.product?.thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop"}
                    alt={item.product?.title}
                    className="w-24 h-24 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product?.slug}`}>
                      <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors" data-testid={`text-cart-item-title-${item.id}`}>{item.product?.title}</h3>
                    </Link>
                    {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>}
                    <p className="font-bold text-base mt-2" data-testid={`text-cart-item-price-${item.id}`}>{formatCurrency(item.product?.sellingPrice * item.quantity)}</p>
                    {item.product?.sellingPrice !== item.product?.basePrice && (
                      <p className="text-xs text-green-600 font-medium">{formatCurrency(item.product?.sellingPrice)} each</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                          className="px-2 py-1.5 hover:bg-muted transition-colors"
                          disabled={updateItem.isPending}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-semibold border-x border-border" data-testid={`text-qty-${item.id}`}>{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                          className="px-2 py-1.5 hover:bg-muted transition-colors"
                          disabled={updateItem.isPending}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Apply Coupon
                </h3>
                {cart?.couponCode ? (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{cart.couponCode} applied!</span>
                    <button onClick={handleRemoveCoupon} className="text-xs text-muted-foreground hover:text-destructive" data-testid="button-remove-coupon">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase"
                      data-testid="input-coupon"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode || applyCoupon.isPending} data-testid="button-apply-coupon">
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span data-testid="text-subtotal">{formatCurrency(cart?.subtotal ?? 0)}</span>
                  </div>
                  {(cart?.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Product Discount</span>
                      <span>-{formatCurrency(cart?.discount ?? 0)}</span>
                    </div>
                  )}
                  {(cart?.couponDiscount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount ({cart?.couponCode})</span>
                      <span data-testid="text-coupon-discount">-{formatCurrency(cart?.couponDiscount ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={cart?.shippingCost === 0 ? "text-green-600 font-medium" : ""} data-testid="text-shipping">
                      {cart?.shippingCost === 0 ? "FREE" : formatCurrency(cart?.shippingCost ?? 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-primary" data-testid="text-total">{formatCurrency(cart?.total ?? 0)}</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 kartigo-gradient border-0"
                  size="lg"
                  onClick={() => setLocation("/checkout")}
                  data-testid="button-checkout"
                >
                  Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">Secure checkout with 256-bit encryption</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
