import { useParams, useLocation } from "wouter";
import { useGetOrder, useCancelOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Link } from "wouter";
import { Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const statusSteps = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: order, isLoading, refetch } = useGetOrder(id, { query: { enabled: isAuthenticated && !!id, queryKey: getGetOrderQueryKey(id) } });
  const cancelOrder = useCancelOrder();

  function handleCancel() {
    cancelOrder.mutate({ id }, {
      onSuccess: () => { refetch(); toast({ title: "Order cancelled" }); },
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) return null;

  const o = order as any;
  const currentStep = statusSteps.indexOf(o.orderStatus);
  const canCancel = ["PLACED", "CONFIRMED"].includes(o.orderStatus);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/orders" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors" data-testid="link-back-orders">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-order-number">#{o.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">Placed on {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          {canCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelOrder.isPending} className="text-destructive border-destructive hover:bg-destructive hover:text-white" data-testid="button-cancel-order">
              Cancel Order
            </Button>
          )}
        </div>

        {/* Status tracker */}
        {!["CANCELLED", "RETURNED"].includes(o.orderStatus) && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="order-tracker">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${i <= currentStep ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`} data-testid={`step-${step}`}>
                    {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i === currentStep ? <Clock className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <span className={`text-xs text-center ${i <= currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>{step}</span>
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute h-0.5 w-full mt-4 ${i < currentStep ? "bg-primary" : "bg-border"}`} style={{ display: "none" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6" data-testid="order-items">
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {o.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center">
                <img src={item.image || ""} alt={item.title} className="w-16 h-16 rounded-lg object-cover border border-border" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {item.itemStatus}</p>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Delivery */}
          <div className="bg-card border border-border rounded-xl p-4" data-testid="delivery-address">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Delivery Address</h3>
            {o.shippingAddress && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{o.shippingAddress.fullName}</p>
                <p>{o.shippingAddress.addressLine1}</p>
                {o.shippingAddress.addressLine2 && <p>{o.shippingAddress.addressLine2}</p>}
                <p>{o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode}</p>
                <p>{o.shippingAddress.phone}</p>
              </div>
            )}
          </div>

          {/* Payment summary */}
          <div className="bg-card border border-border rounded-xl p-4" data-testid="payment-summary">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{o.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={o.paymentStatus === "PAID" ? "text-green-600 border-green-600" : ""}>{o.paymentStatus}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(o.subtotal)}</span></div>
              {o.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>-{formatCurrency(o.couponDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{o.shippingCost === 0 ? "FREE" : formatCurrency(o.shippingCost)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(o.total)}</span></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
