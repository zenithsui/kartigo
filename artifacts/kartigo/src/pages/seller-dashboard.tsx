import { useAuth } from "@workspace/replit-auth-web";
import { useGetSellerDashboard, useGetSellerProducts, useGetSellerOrders, useGetSellerFinances, getGetSellerDashboardQueryKey, getGetSellerProductsQueryKey, getGetSellerOrdersQueryKey, getGetSellerFinancesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, TrendingUp, ShoppingBag, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils";

export default function SellerDashboardPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: dashboard, isLoading } = useGetSellerDashboard({ query: { enabled: isAuthenticated, queryKey: getGetSellerDashboardQueryKey() } });
  const { data: products } = useGetSellerProducts({ page: 1, limit: 10 }, { query: { enabled: isAuthenticated, queryKey: getGetSellerProductsQueryKey({ page: 1, limit: 10 }) } });
  const { data: orders } = useGetSellerOrders({ page: 1 }, { query: { enabled: isAuthenticated, queryKey: getGetSellerOrdersQueryKey({ page: 1 }) } });
  const { data: finances } = useGetSellerFinances({ query: { enabled: isAuthenticated, queryKey: getGetSellerFinancesQueryKey() } });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to access Seller Dashboard</h2>
          <Button onClick={login} className="kartigo-gradient border-0">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const d = dashboard as any;
  const f = finances as any;
  const stats = [
    { label: "Total Revenue", value: formatCurrency(d?.revenue ?? 0), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "Orders Today", value: d?.ordersToday ?? 0, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending Shipments", value: d?.pendingShipments ?? 0, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Total Products", value: d?.totalProducts ?? 0, icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-seller-dashboard-title">Seller Dashboard</h1>
          <Button className="kartigo-gradient border-0" size="sm" data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="seller-stats">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" data-testid={`stat-${i}`}>{isLoading ? <Skeleton className="h-7 w-20" /> : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        {d?.revenueChart && (
          <div className="bg-card border border-border rounded-xl p-4 mb-8" data-testid="revenue-chart">
            <h3 className="font-semibold mb-4">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(258 73% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products" data-testid="tab-seller-products">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-seller-orders">Orders</TabsTrigger>
            <TabsTrigger value="finances" data-testid="tab-seller-finances">Finances</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="seller-products-list">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Product</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Stock</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((products as any)?.products ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30" data-testid={`seller-product-row-${p.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-medium line-clamp-1">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{p.stock}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="seller-orders-list">
              {((orders as any)?.orders ?? []).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border-b border-border last:border-0" data-testid={`seller-order-${order.id}`}>
                  <div>
                    <p className="font-medium text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge variant="outline">{order.orderStatus}</Badge>
                  <span className="font-semibold text-sm">{formatCurrency(order.total)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="finances">
            <div className="grid md:grid-cols-2 gap-4" data-testid="finances-section">
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-semibold mb-4">Earnings Overview</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Earnings</span><span className="font-bold text-green-600">{formatCurrency(f?.totalEarnings ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">This Month</span><span className="font-semibold">{formatCurrency(f?.thisMonthEarnings ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pending Payout</span><span className="font-semibold text-orange-600">{formatCurrency(f?.pendingPayout ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Commission Rate</span><span>{f?.commissionRate ?? 10}%</span></div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-semibold mb-3">Payout History</h4>
                <p className="text-muted-foreground text-sm">No payouts yet. Keep selling!</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
