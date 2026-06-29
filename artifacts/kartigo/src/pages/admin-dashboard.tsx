import { useAuth } from "@workspace/replit-auth-web";
import { useGetAdminDashboard, useAdminListUsers, useAdminListProducts, useAdminListOrders, getGetAdminDashboardQueryKey, getAdminListUsersQueryKey, getAdminListProductsQueryKey, getAdminListOrdersQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Package, ShoppingBag, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: dashboard, isLoading } = useGetAdminDashboard({ query: { enabled: isAuthenticated, queryKey: getGetAdminDashboardQueryKey() } });
  const { data: users } = useAdminListUsers({ page: 1 }, { query: { enabled: isAuthenticated, queryKey: getAdminListUsersQueryKey({ page: 1 }) } });
  const { data: products } = useAdminListProducts({ page: 1 }, { query: { enabled: isAuthenticated, queryKey: getAdminListProductsQueryKey({ page: 1 }) } });
  const { data: orders } = useAdminListOrders({ page: 1 }, { query: { enabled: isAuthenticated, queryKey: getAdminListOrdersQueryKey({ page: 1 }) } });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin access required</h2>
          <Button onClick={login} className="kartigo-gradient border-0">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const d = dashboard as any;
  const stats = [
    { label: "Total Users", value: d?.totalUsers?.toLocaleString() ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Orders", value: d?.totalOrders?.toLocaleString() ?? 0, icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Total Revenue", value: formatCurrency(d?.totalRevenue ?? 0), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total Products", value: d?.totalProducts?.toLocaleString() ?? 0, icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-admin-title">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold" data-testid={`admin-stat-${i}`}>{stat.value}</p>}
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        {d?.revenueChart && (
          <div className="bg-card border border-border rounded-xl p-4 mb-8" data-testid="admin-revenue-chart">
            <h3 className="font-semibold mb-4">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
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

        <Tabs defaultValue="orders">
          <TabsList className="mb-4">
            <TabsTrigger value="orders" data-testid="tab-admin-orders">Orders</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-admin-products">Products</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-admin-users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="admin-orders-table">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Order #</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {((orders as any)?.orders ?? []).map((order: any) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30" data-testid={`admin-order-row-${order.id}`}>
                      <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{order.orderStatus}</Badge></td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="admin-products-table">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Product</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((products as any)?.products ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30" data-testid={`admin-product-row-${p.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover" />
                          <span className="font-medium line-clamp-1">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-4 py-3"><Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-green-100 text-green-700 border-0" : ""}>{p.isActive ? "Active" : "Inactive"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="admin-users-table">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">User</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {((users as any)?.users ?? []).map((u: any) => (
                    <tr key={u.replitId} className="border-b border-border last:border-0 hover:bg-muted/30" data-testid={`admin-user-row-${u.replitId}`}>
                      <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{u.role}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
