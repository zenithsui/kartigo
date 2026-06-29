import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-gray-100 text-gray-700",
};

export default function OrdersPage() {
  const { isAuthenticated, login } = useAuth();
  const { data, isLoading } = useListOrders({ page: 1, limit: 20 }, { query: { enabled: isAuthenticated, queryKey: getListOrdersQueryKey({ page: 1, limit: 20 }) } });

  const orders = (data as any)?.orders ?? [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view orders</h2>
          <Button onClick={login} className="kartigo-gradient border-0" data-testid="button-login-orders">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const filterOrders = (status?: string) =>
    status ? orders.filter((o: any) => o.orderStatus === status) : orders;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-orders-title">My Orders</h1>

        <Tabs defaultValue="all">
          <TabsList className="mb-6 flex-wrap h-auto" data-testid="tabs-order-status">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PLACED">Placed</TabsTrigger>
            <TabsTrigger value="SHIPPED">Shipped</TabsTrigger>
            <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>

          {["all", "PLACED", "SHIPPED", "DELIVERED", "CANCELLED"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              ) : filterOrders(tab === "all" ? undefined : tab).length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center" data-testid="state-no-orders">
                  <Package className="w-16 h-16 text-muted mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <Link href="/products"><Button className="kartigo-gradient border-0 mt-2" data-testid="button-shop">Shop Now</Button></Link>
                </div>
              ) : (
                <div className="space-y-4" data-testid="orders-list">
                  {filterOrders(tab === "all" ? undefined : tab).map((order: any) => (
                    <Link key={order.id} href={`/orders/${order.id}`} data-testid={`link-order-${order.id}`}>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm" data-testid={`text-order-number-${order.id}`}>#{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.orderStatus] ?? "bg-gray-100 text-gray-700"}`} data-testid={`badge-status-${order.id}`}>
                              {order.orderStatus}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {order.items.slice(0, 3).map((item: any) => (
                            <img key={item.id} src={item.image || ""} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-border" />
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                          <span className="font-bold text-foreground" data-testid={`text-order-total-${order.id}`}>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
