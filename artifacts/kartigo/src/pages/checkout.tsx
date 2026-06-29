import { useState } from "react";
import { useGetCart, useGetUserAddresses, useCreateOrder, useCreatePaymentOrder, useVerifyPayment, getGetCartQueryKey, getListOrdersQueryKey, getGetUserAddressesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, CreditCard, ChevronRight, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";

const paymentMethods = [
  { id: "UPI", label: "UPI (GPay, PhonePe, Paytm)", icon: "📱" },
  { id: "CARD", label: "Credit / Debit Card", icon: "💳" },
  { id: "NETBANKING", label: "Net Banking", icon: "🏦" },
  { id: "COD", label: "Cash on Delivery", icon: "💵" },
];

export default function CheckoutPage() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [step, setStep] = useState<"address" | "payment" | "review">("address");
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [addingAddress, setAddingAddress] = useState(false);

  const { data: cart } = useGetCart();
  const { data: addresses = [] } = useGetUserAddresses({ query: { enabled: isAuthenticated, queryKey: getGetUserAddressesQueryKey() } });
  const createOrder = useCreateOrder();
  const createPayment = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const { register, handleSubmit, reset } = useForm();

  function handleAddAddress(data: any) {
    // In real app, would call API. For demo, just close.
    setAddingAddress(false);
    reset();
    toast({ title: "Address saved!" });
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      toast({ title: "Please select a delivery address", variant: "destructive" });
      return;
    }
    createOrder.mutate(
      { data: { addressId: selectedAddress, paymentMethod } },
      {
        onSuccess: async (order: any) => {
          if (paymentMethod !== "COD") {
            // Mock Razorpay flow
            createPayment.mutate(
              { data: { orderId: order.id, amount: order.total } },
              {
                onSuccess: (paymentOrder: any) => {
                  // Simulate payment success
                  setTimeout(() => {
                    verifyPayment.mutate(
                      { data: { orderId: order.id, razorpayOrderId: paymentOrder.razorpayOrderId, razorpayPaymentId: "pay_mock_" + Date.now(), razorpaySignature: "sig_mock" } },
                      {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
                          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
                          setOrderSuccess(order);
                        },
                      },
                    );
                  }, 1500);
                },
              },
            );
          } else {
            queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            setOrderSuccess(order);
          }
        },
        onError: () => toast({ title: "Failed to place order", variant: "destructive" }),
      },
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to checkout</h2>
          <Button onClick={login} className="kartigo-gradient border-0">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center max-w-lg">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-order-success">Order Placed! 🎉</h2>
          <p className="text-muted-foreground mb-2">Your order <strong>#{orderSuccess.orderNumber}</strong> has been placed successfully.</p>
          <p className="text-sm text-muted-foreground mb-6">Estimated delivery in 3–5 business days.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setLocation("/orders")} data-testid="button-view-orders">View Orders</Button>
            <Button className="kartigo-gradient border-0" onClick={() => setLocation("/")} data-testid="button-continue-shopping">Continue Shopping</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Checkout</h1>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {[{ key: "address", label: "Address" }, { key: "payment", label: "Payment" }, { key: "review", label: "Review" }].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => setStep(s.key as any)}
                className={`flex items-center gap-1.5 font-medium transition-colors ${step === s.key ? "text-primary" : "text-muted-foreground"}`}
                data-testid={`step-${s.key}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s.key ? "bg-primary text-white" : "bg-muted"}`}>{i + 1}</span>
                {s.label}
              </button>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="bg-card border border-border rounded-xl p-6" data-testid="section-address">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h2>
                <Dialog open={addingAddress} onOpenChange={setAddingAddress}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-add-address"><Plus className="w-3.5 h-3.5 mr-1" />Add New</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Address</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Full Name</Label><Input {...register("fullName")} placeholder="Full name" data-testid="input-full-name" /></div>
                        <div><Label>Phone</Label><Input {...register("phone")} placeholder="10-digit number" data-testid="input-phone" /></div>
                      </div>
                      <div><Label>Address Line 1</Label><Input {...register("addressLine1")} placeholder="House/Flat number" data-testid="input-address-line1" /></div>
                      <div><Label>Address Line 2 (optional)</Label><Input {...register("addressLine2")} placeholder="Street, Area" data-testid="input-address-line2" /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>City</Label><Input {...register("city")} data-testid="input-city" /></div>
                        <div><Label>State</Label><Input {...register("state")} data-testid="input-state" /></div>
                        <div><Label>Pincode</Label><Input {...register("pincode")} data-testid="input-pincode" /></div>
                      </div>
                      <Button type="submit" className="w-full kartigo-gradient border-0" data-testid="button-save-address">Save Address</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {(addresses as any[]).length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-addresses">No saved addresses. Add one to continue.</p>
              ) : (
                <RadioGroup value={String(selectedAddress)} onValueChange={(v) => setSelectedAddress(Number(v))}>
                  <div className="space-y-3">
                    {(addresses as any[]).map((addr: any) => (
                      <div key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${selectedAddress === addr.id ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => setSelectedAddress(addr.id)}>
                        <RadioGroupItem value={String(addr.id)} id={`addr-${addr.id}`} className="mt-0.5" data-testid={`radio-address-${addr.id}`} />
                        <Label htmlFor={`addr-${addr.id}`} className="cursor-pointer flex-1">
                          <p className="font-medium text-sm">{addr.fullName} · <span className="text-muted-foreground font-normal">{addr.phone}</span></p>
                          <p className="text-sm text-muted-foreground">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">{addr.type}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-6" data-testid="section-payment">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Method
              </h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => setPaymentMethod(pm.id)}>
                      <RadioGroupItem value={pm.id} id={`pm-${pm.id}`} data-testid={`radio-payment-${pm.id}`} />
                      <Label htmlFor={`pm-${pm.id}`} className="cursor-pointer flex items-center gap-2">
                        <span>{pm.icon}</span> {pm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.product?.thumbnail || ""} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.product?.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatCurrency((item.product?.sellingPrice ?? 0) * item.quantity)}</span>
                  </div>
                ))}
                {items.length > 3 && <p className="text-xs text-muted-foreground">+{items.length - 3} more items</p>}
              </div>
              <Separator />
              <div className="space-y-2 text-sm mt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(cart?.subtotal ?? 0)}</span></div>
                {(cart?.couponDiscount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>-{formatCurrency(cart?.couponDiscount ?? 0)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className={cart?.shippingCost === 0 ? "text-green-600" : ""}>{cart?.shippingCost === 0 ? "FREE" : formatCurrency(cart?.shippingCost ?? 0)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-checkout-total">{formatCurrency(cart?.total ?? 0)}</span>
                </div>
              </div>
              <Button
                className="w-full mt-4 kartigo-gradient border-0"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending || !selectedAddress}
                data-testid="button-place-order"
              >
                {createOrder.isPending ? "Placing Order..." : `Place Order · ${formatCurrency(cart?.total ?? 0)}`}
              </Button>
              {paymentMethod !== "COD" && (
                <p className="text-xs text-muted-foreground text-center mt-2">Payment secured by Razorpay</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
