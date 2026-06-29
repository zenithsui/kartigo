import { useState, useEffect, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Star, LogOut, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Upload, Plus, Trash2,
  Download, Moon, Sun, ArrowUpDown, Edit2, X, Search, Zap, ImagePlus, Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const INDIGO = "#3730A3";
const INDIGO_LIGHT = "#4338CA";

type Section = "dashboard" | "products" | "orders" | "users" | "reviews" | "sorting";
const ORDER_STATUSES = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const EMPTY_FORM = {
  title: "", description: "", richDescription: "",
  basePrice: "", sellingPrice: "", categoryId: "",
  stock: "0", thumbnail: "", tags: "",
  sku: "", weight: "", flashSalePrice: "", flashSaleEnd: "",
};

function useApi<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(url, { credentials: "include" }).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, setData };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PLACED: "bg-blue-100 text-blue-700", CONFIRMED: "bg-cyan-100 text-cyan-700",
    SHIPPED: "bg-purple-100 text-purple-700", DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700", RETURNED: "bg-orange-100 text-orange-700",
    ACTIVE: "bg-green-100 text-green-700", INACTIVE: "bg-gray-100 text-gray-600",
    APPROVED: "bg-green-100 text-green-700", PENDING: "bg-amber-100 text-amber-700",
    SUSPENDED: "bg-red-100 text-red-700", REJECTED: "bg-red-100 text-red-600",
    PAID: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-600",
    ADMIN: "bg-indigo-100 text-indigo-700", SELLER: "bg-purple-100 text-purple-700",
    BUYER: "bg-gray-100 text-gray-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

export default function AdminPanel() {
  const { user, isLoading, login } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [dark, setDark] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  // Sorting (product management) state
  const [sortModal, setSortModal] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSpecs, setFormSpecs] = useState<{key: string; value: string}[]>([]);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formFlashSale, setFormFlashSale] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryHint, setCategoryHint] = useState<any | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [sortSearch, setSortSearch] = useState("");
  const [sortPage, setSortPage] = useState(1);
  const thumbRef = useRef<HTMLInputElement>(null);
  const extraImgRef = useRef<HTMLInputElement>(null);

  const { data: dash, loading: dashLoading } = useApi<any>("/api/admin/dashboard", []);
  const { data: productsRes, loading: productsLoading, setData: setProducts } = useApi<any>(`/api/admin/products?page=${productPage}`, [section === "products" ? section : "_", productPage]);
  const { data: sortRes, loading: sortLoading, setData: setSortProducts } = useApi<any>(`/api/admin/products?page=${sortPage}${sortSearch ? `&q=${encodeURIComponent(sortSearch)}` : ""}`, [section === "sorting" ? section : "_", sortPage, sortSearch]);
  const { data: ordersRes, loading: ordersLoading } = useApi<any>(`/api/admin/orders?page=${orderPage}${orderStatusFilter ? `&status=${orderStatusFilter}` : ""}`, [section, orderPage, orderStatusFilter]);
  const { data: usersRes, loading: usersLoading, setData: setUsers } = useApi<any>(`/api/admin/users?page=${userPage}`, [section, userPage]);
  const { data: reviews, loading: reviewsLoading, setData: setReviews } = useApi<any>("/api/admin/reviews", [section]);

  useEffect(() => {
    fetch("/api/admin/categories", { credentials: "include" })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d); });
  }, []);

  function detectBestCategory(title: string, desc: string): any | null {
    const text = (title + " " + desc).toLowerCase();
    let best: any = null;
    let bestScore = 0;
    for (const cat of categories) {
      const words = cat.name.toLowerCase().split(/[\s,/&-]+/).filter((w: string) => w.length > 2);
      let score = words.reduce((s: number, w: string) => s + (text.includes(w) ? 1 : 0), 0);
      if (score > bestScore) { best = cat; bestScore = score; }
    }
    return bestScore > 0 ? best : null;
  }

  function handleTitleChange(val: string) {
    setProductForm(f => ({ ...f, title: val }));
    const hint = detectBestCategory(val, productForm.description);
    setCategoryHint(hint);
  }

  function handleDescChange(val: string) {
    setProductForm(f => ({ ...f, description: val }));
    const hint = detectBestCategory(productForm.title, val);
    setCategoryHint(hint);
  }

  const role = (user as any)?.role;
  const bg = dark ? "bg-gray-900" : "bg-slate-50";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
  const text = dark ? "text-gray-100" : "text-gray-900";
  const subtext = dark ? "text-gray-400" : "text-gray-500";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#EEF2FF" }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" /></div>;
  if (!user || (role !== "ADMIN" && role !== "OWNER")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in with your admin account to continue.</p>
          <button onClick={login} className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg,${INDIGO},${INDIGO_LIGHT})` }}>Sign In</button>
        </div>
      </div>
    );
  }

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "products", label: "Products", icon: <Package className="w-5 h-5" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="w-5 h-5" /> },
    { id: "sorting", label: "Sorting", icon: <ArrowUpDown className="w-5 h-5" /> },
  ];

  async function toggleProduct(id: string, field: string, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ [field]: !current }) });
    const data = await res.json();
    setProducts((prev: any) => prev ? { ...prev, products: prev.products.map((p: any) => p.id === id ? { ...p, ...data } : p) } : prev);
  }

  async function toggleSortProduct(id: string, field: string, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ [field]: !current }) });
    const data = await res.json();
    setSortProducts((prev: any) => prev ? { ...prev, products: prev.products.map((p: any) => p.id === id ? { ...p, ...data } : p) } : prev);
  }

  async function updateOrderStatus(id: string, orderStatus: string) {
    await fetch(`/api/admin/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ orderStatus }) });
  }

  async function banUser(id: number | string, isActive: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ isActive: !isActive }) });
    const data = await res.json();
    setUsers((prev: any) => prev ? { ...prev, users: prev.users.map((u: any) => u.replitId === data.replitId ? data : u) } : prev);
  }

  async function moderateReview(id: number, approve: boolean) {
    await fetch(`/api/admin/reviews/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ isApproved: approve }) });
    setReviews((prev: any) => prev ? { ...prev, reviews: prev.reviews.map((r: any) => r.id === id ? { ...r, isApproved: approve } : r) } : prev);
  }

  async function deleteReview(id: number) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
    setReviews((prev: any) => prev ? { ...prev, reviews: prev.reviews.filter((r: any) => r.id !== id) } : prev);
  }

  function exportOrders() {
    window.open("/api/admin/orders/export", "_blank");
  }

  async function uploadThumb() {
    const file = thumbRef.current?.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    const fd = new FormData(); fd.append("image", file); fd.append("folder", "kartigo/products");
    const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (res.ok) setProductForm(f => ({ ...f, thumbnail: data.url }));
    setUploadingThumb(false);
  }

  async function uploadExtraImage() {
    const file = extraImgRef.current?.files?.[0];
    if (!file) return;
    setUploadingExtra(true);
    const fd = new FormData(); fd.append("image", file); fd.append("folder", "kartigo/products");
    const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (res.ok) setFormImages(imgs => [...imgs, data.url]);
    if (extraImgRef.current) extraImgRef.current.value = "";
    setUploadingExtra(false);
  }

  function openAdd() {
    setProductForm(EMPTY_FORM);
    setFormImages([]);
    setFormSpecs([]);
    setFormFeatured(false);
    setFormFlashSale(false);
    setCategoryHint(null);
    setEditingProduct(null);
    setSortModal("add");
  }

  function openEdit(p: any) {
    setProductForm({
      title: p.title, description: p.description ?? "",
      richDescription: p.richDescription ?? "",
      basePrice: String(p.basePrice), sellingPrice: String(p.sellingPrice),
      categoryId: String(p.categoryId ?? ""), stock: String(p.stock),
      thumbnail: p.thumbnail ?? "", tags: (p.tags ?? []).join(", "),
      sku: p.sku ?? "", weight: p.weight ? String(p.weight) : "",
      flashSalePrice: p.flashSalePrice ? String(p.flashSalePrice) : "",
      flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.slice(0, 16) : "",
    });
    setFormImages(p.images ?? []);
    const specs = p.specifications && typeof p.specifications === "object"
      ? Object.entries(p.specifications).map(([key, value]) => ({ key, value: String(value) }))
      : [];
    setFormSpecs(specs);
    setFormFeatured(p.isFeatured ?? false);
    setFormFlashSale(p.isFlashSale ?? false);
    setCategoryHint(null);
    setEditingProduct(p);
    setSortModal("edit");
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault(); setSubmittingProduct(true);
    const specsObj = formSpecs.reduce((acc, s) => s.key ? { ...acc, [s.key]: s.value } : acc, {} as Record<string, string>);
    const body = {
      title: productForm.title, description: productForm.description,
      richDescription: productForm.richDescription,
      basePrice: Number(productForm.basePrice), sellingPrice: Number(productForm.sellingPrice),
      categoryId: Number(productForm.categoryId), stock: Number(productForm.stock),
      thumbnail: productForm.thumbnail, images: formImages,
      tags: productForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      sku: productForm.sku || null,
      weight: productForm.weight ? Number(productForm.weight) : null,
      specifications: specsObj,
      isFeatured: formFeatured,
      isFlashSale: formFlashSale,
      flashSalePrice: formFlashSale && productForm.flashSalePrice ? Number(productForm.flashSalePrice) : null,
      flashSaleEnd: formFlashSale && productForm.flashSaleEnd ? productForm.flashSaleEnd : null,
    };
    if (sortModal === "add") {
      const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) setSortProducts((prev: any) => prev ? { ...prev, products: [data, ...prev.products], total: (prev.total ?? 0) + 1 } : prev);
    } else if (sortModal === "edit" && editingProduct) {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) setSortProducts((prev: any) => prev ? { ...prev, products: prev.products.map((p: any) => p.id === editingProduct.id ? data : p) } : prev);
    }
    setSubmittingProduct(false);
    setSortModal(null);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    setSortProducts((prev: any) => prev ? { ...prev, products: prev.products.filter((p: any) => p.id !== id), total: Math.max(0, (prev.total ?? 1) - 1) } : prev);
  }

  const Sidebar = () => (
    <aside className="w-60 min-h-screen shrink-0 flex flex-col" style={{ background: "linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)" }}>
      <div className="p-5 border-b border-indigo-800/30">
        <span className="font-bold text-white text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>🛡️ Admin Panel</span>
        <p className="text-indigo-300/60 text-xs mt-1 truncate">{(user as any).email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.id ? "bg-white text-indigo-900" : "text-indigo-200 hover:bg-indigo-800/30"}`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-indigo-800/30 space-y-2">
        <button onClick={() => setDark(d => !d)} className="flex items-center gap-2 text-indigo-300/60 text-sm hover:text-indigo-200 w-full">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "Light Mode" : "Dark Mode"}
        </button>
        <a href="/" className="flex items-center gap-2 text-indigo-300/60 text-sm hover:text-indigo-200"><LogOut className="w-4 h-4" />Back to Store</a>
      </div>
    </aside>
  );

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        {/* ── Dashboard ── */}
        {section === "dashboard" && (
          <div className="space-y-6 max-w-5xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
            {dashLoading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(dash?.totalRevenue ?? 0), icon: <TrendingUp className="w-5 h-5 text-indigo-600" /> },
                  { label: "Total Orders", value: (dash?.totalOrders ?? 0).toLocaleString(), icon: <ShoppingBag className="w-5 h-5 text-indigo-600" /> },
                  { label: "Total Products", value: (dash?.totalProducts ?? 0).toLocaleString(), icon: <Package className="w-5 h-5 text-indigo-600" /> },
                  { label: "Total Users", value: (dash?.totalUsers ?? 0).toLocaleString(), icon: <Users className="w-5 h-5 text-indigo-600" /> },
                  { label: "Today's Revenue", value: formatCurrency(dash?.revenueToday ?? 0), icon: <TrendingUp className="w-5 h-5 text-indigo-600" /> },
                  { label: "Today's Orders", value: (dash?.ordersToday ?? 0).toLocaleString(), icon: <ShoppingBag className="w-5 h-5 text-indigo-600" /> },
                  { label: "Total Sellers", value: (dash?.totalSellers ?? 0).toLocaleString(), icon: <Users className="w-5 h-5 text-indigo-600" /> },
                  { label: "Low Stock Alerts", value: (dash?.lowStockProducts?.length ?? 0).toLocaleString(), icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
                ].map(c => (
                  <div key={c.label} className={`${card} rounded-2xl p-5 border shadow-sm`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">{c.icon}</div>
                    <p className={`text-2xl font-bold ${text}`}>{c.value}</p>
                    <p className={`text-sm ${subtext} mt-0.5`}>{c.label}</p>
                  </div>
                ))}
              </div>
            )}
            {dash?.revenueChart && (
              <div className={`${card} rounded-2xl p-6 border`}>
                <h3 className={`font-semibold ${text} mb-4`}>Revenue — Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dash.revenueChart}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill={INDIGO} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {dash?.lowStockProducts && dash.lowStockProducts.length > 0 && (
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className={`font-semibold ${text}`}>Low Stock Alerts</h3>
                </div>
                <table className="w-full">
                  <thead><tr className="bg-red-50 border-b border-red-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th></tr></thead>
                  <tbody>
                    {dash.lowStockProducts.map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.title}</td>
                        <td className="px-5 py-3"><span className={`text-sm font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{p.stock === 0 ? "OUT OF STOCK" : `${p.stock} left`}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {dash?.recentOrders && (
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <div className={`px-6 py-4 border-b border-gray-100`}><h3 className={`font-semibold ${text}`}>Recent Orders</h3></div>
                <table className="w-full">
                  <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th></tr></thead>
                  <tbody>{dash.recentOrders.map((o: any) => <tr key={o.id} className="border-b border-gray-50"><td className="px-5 py-3 text-sm font-mono text-gray-700">{o.orderNumber}</td><td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td><td className="px-5 py-3 text-sm font-semibold">{formatCurrency(o.total)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Products (view/toggle only) ── */}
        {section === "products" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Products</h1>
              <p className={`text-sm ${subtext}`}>Toggle active / featured status. Use <strong>Sorting</strong> to add or remove products.</p>
            </div>
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Featured</th></tr></thead>
                <tbody>
                  {productsLoading ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                    (productsRes?.products ?? []).map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={p.thumbnail ?? ""} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" /><span className={`text-sm font-medium ${text} max-w-48 truncate`}>{p.title}</span></div></td>
                        <td className="px-5 py-3 text-sm">{formatCurrency(p.sellingPrice)}</td>
                        <td className={`px-5 py-3 text-sm ${p.stock <= 5 ? "text-red-600 font-semibold" : ""}`}>{p.stock}</td>
                        <td className="px-5 py-3"><button onClick={() => toggleProduct(p.id, "isActive", p.isActive)}>{p.isActive ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}</button></td>
                        <td className="px-5 py-3"><button onClick={() => toggleProduct(p.id, "isFeatured", p.isFeatured)}>{p.isFeatured ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{productsRes?.total ?? 0} products</span>
                <div className="flex gap-2">
                  <button disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={productPage >= (productsRes?.totalPages ?? 1)} onClick={() => setProductPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {section === "orders" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Orders</h1>
              <div className="flex gap-3">
                <button onClick={exportOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50">
                  <Download className="w-4 h-4" />Export CSV
                </button>
                <select value={orderStatusFilter} onChange={e => { setOrderStatusFilter(e.target.value); setOrderPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Status</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Update</th></tr></thead>
                <tbody>
                  {ordersLoading ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                    (ordersRes?.orders ?? []).map((o: any) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-mono text-gray-700">{o.orderNumber}</td>
                        <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(o.total)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.paymentStatus} /></td>
                        <td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td>
                        <td className="px-5 py-3">
                          <select defaultValue={o.orderStatus} onChange={e => updateOrderStatus(o.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{ordersRes?.total ?? 0} orders</span>
                <div className="flex gap-2">
                  <button disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={orderPage >= (ordersRes?.totalPages ?? 1)} onClick={() => setOrderPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {section === "users" && (
          <div className="space-y-4 max-w-5xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Users</h1>
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody>
                  {usersLoading ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                    ((usersRes?.users ?? []) as any[]).filter((u: any) => u.role !== "OWNER").map((u: any) => (
                      <tr key={u.replitId ?? u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3"><p className={`font-medium text-sm ${text}`}>{u.name || "—"}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                        <td className="px-5 py-3"><StatusBadge status={u.role} /></td>
                        <td className="px-5 py-3"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                        <td className="px-5 py-3">
                          <button onClick={() => banUser(u.replitId ?? u.id, u.isActive)} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${u.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>{u.isActive ? "Ban" : "Unban"}</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{usersRes?.total ?? 0} users</span>
                <div className="flex gap-2">
                  <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={userPage >= (usersRes?.totalPages ?? 1)} onClick={() => setUserPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {section === "reviews" && (
          <div className="space-y-4 max-w-5xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Reviews</h1>
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Review</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody>
                  {reviewsLoading ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                    ((reviews?.reviews ?? []) as any[]).map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 max-w-xs">
                          <p className={`font-medium text-sm ${text}`}>{r.title || "—"}</p>
                          <p className="text-xs text-gray-500 truncate">{r.body}</p>
                        </td>
                        <td className="px-5 py-3 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                        <td className="px-5 py-3"><StatusBadge status={r.isApproved ? "APPROVED" : "PENDING"} /></td>
                        <td className="px-5 py-3 flex gap-2">
                          {!r.isApproved && <button onClick={() => moderateReview(r.id, true)} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approve</button>}
                          {r.isApproved && <button onClick={() => moderateReview(r.id, false)} className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3" />Reject</button>}
                          <button onClick={() => deleteReview(r.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Sorting (Product Management) ── */}
        {section === "sorting" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Sorting</h1>
                <p className={`text-sm ${subtext} mt-0.5`}>Add, edit, or remove products across the whole store. Added products are visible to everyone.</p>
              </div>
              <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg,${INDIGO},${INDIGO_LIGHT})` }}>
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={sortSearch}
                onChange={e => { setSortSearch(e.target.value); setSortPage(1); }}
                placeholder="Search products by name…"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Featured</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortLoading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
                  ) : (sortRes?.products ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-10 h-10 text-gray-300" />
                        <p className="text-sm">No products found. Click <strong>Add Product</strong> to get started.</p>
                      </div>
                    </td></tr>
                  ) : (sortRes?.products ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/80 group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-gray-400" /></div>
                          )}
                          <div>
                            <p className={`text-sm font-medium ${text} max-w-52 truncate`}>{p.title}</p>
                            <p className="text-xs text-gray-400">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className={`text-sm font-semibold ${text}`}>{formatCurrency(p.sellingPrice)}</p>
                        {p.discount > 0 && <p className="text-xs text-green-600">{p.discount}% off</p>}
                      </td>
                      <td className={`px-5 py-3 text-sm font-medium ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : "text-gray-700"}`}>{p.stock === 0 ? "Out of stock" : p.stock}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleSortProduct(p.id, "isActive", p.isActive)}>
                          {p.isActive ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleSortProduct(p.id, "isFeatured", p.isFeatured)}>
                          {p.isFeatured ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{sortRes?.total ?? 0} products total</span>
                <div className="flex gap-2">
                  <button disabled={sortPage <= 1} onClick={() => setSortPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-xs text-gray-500 self-center px-2">Page {sortPage} / {sortRes?.totalPages ?? 1}</span>
                  <button disabled={sortPage >= (sortRes?.totalPages ?? 1)} onClick={() => setSortPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}


      </main>

      {/* ── Add / Edit Product Modal ── */}
      {sortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{sortModal === "add" ? "Add New Product" : "Edit Product"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">All products appear in <strong>All Products</strong> automatically</p>
              </div>
              <button onClick={() => setSortModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitProduct} className="p-6 space-y-6">

              {/* Auto-category hint banner */}
              {categoryHint && String(categoryHint.id) !== productForm.categoryId && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700">This looks like it belongs in <strong>{categoryHint.name}</strong> — auto-correct?</p>
                  </div>
                  <button type="button" onClick={() => setProductForm(f => ({ ...f, categoryId: String(categoryHint.id) }))} className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">Apply →</button>
                </div>
              )}

              {/* ── Basic Info ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Basic Info</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Product Title *</label>
                  <input required value={productForm.title} onChange={e => handleTitleChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Premium Wireless Headphones" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">SKU</label>
                    <input value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="WH-1000XM5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Category *</label>
                    <select required value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Select area…</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Short Description</label>
                  <textarea rows={2} value={productForm.description} onChange={e => handleDescChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Brief product summary shown in listings…" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Description</label>
                  <textarea rows={4} value={productForm.richDescription} onChange={e => setProductForm(f => ({ ...f, richDescription: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Detailed product description, features, benefits…" />
                </div>
              </div>

              {/* ── Pricing ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Base / MRP (₹) *</label>
                    <input required type="number" min="0" step="0.01" value={productForm.basePrice} onChange={e => setProductForm(f => ({ ...f, basePrice: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="999" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Selling Price (₹) *</label>
                    <input required type="number" min="0" step="0.01" value={productForm.sellingPrice} onChange={e => setProductForm(f => ({ ...f, sellingPrice: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="799" />
                  </div>
                </div>
                {productForm.basePrice && productForm.sellingPrice && Number(productForm.basePrice) > 0 && Number(productForm.sellingPrice) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Discount:</span>
                    <span className={`font-semibold ${Number(productForm.sellingPrice) < Number(productForm.basePrice) ? "text-green-600" : "text-red-500"}`}>
                      {Math.round(((Number(productForm.basePrice) - Number(productForm.sellingPrice)) / Number(productForm.basePrice)) * 100)}% off
                    </span>
                  </div>
                )}
              </div>

              {/* ── Inventory ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Inventory & Shipping</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Stock Quantity</label>
                    <input type="number" min="0" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Weight (kg)</label>
                    <input type="number" min="0" step="0.001" value={productForm.weight} onChange={e => setProductForm(f => ({ ...f, weight: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.5" />
                  </div>
                </div>
              </div>

              {/* ── Media ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Media</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Thumbnail (Main Image)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400 truncate bg-gray-50">
                      {productForm.thumbnail || "No thumbnail uploaded"}
                    </div>
                    <label className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 cursor-pointer">
                      <Upload className="w-4 h-4" />{uploadingThumb ? "Uploading…" : "Upload"}
                      <input type="file" accept="image/*" ref={thumbRef} className="hidden" onChange={uploadThumb} />
                    </label>
                  </div>
                  {productForm.thumbnail && <img src={productForm.thumbnail} alt="" className="mt-2 w-20 h-20 rounded-xl object-cover border border-gray-200" />}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-500">Additional Images</label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5" />{uploadingExtra ? "Uploading…" : "Add Image"}
                      <input type="file" accept="image/*" ref={extraImgRef} className="hidden" onChange={uploadExtraImage} />
                    </label>
                  </div>
                  {formImages.length === 0 && <p className="text-xs text-gray-400 italic">No extra images added yet</p>}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                        <button type="button" onClick={() => setFormImages(imgs => imgs.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Product Flags ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Product Flags</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-indigo-500" /><span className="text-sm font-medium text-gray-700">Featured</span></div>
                    <button type="button" onClick={() => setFormFeatured(v => !v)}>
                      {formFeatured ? <ToggleRight className="w-7 h-7 text-indigo-600" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-gray-700">Flash Sale</span></div>
                    <button type="button" onClick={() => setFormFlashSale(v => !v)}>
                      {formFlashSale ? <ToggleRight className="w-7 h-7 text-orange-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                    </button>
                  </div>
                </div>
                {formFlashSale && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Flash Sale Price (₹)</label>
                      <input type="number" min="0" step="0.01" value={productForm.flashSalePrice} onChange={e => setProductForm(f => ({ ...f, flashSalePrice: e.target.value }))}
                        className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="599" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Flash Sale Ends</label>
                      <input type="datetime-local" value={productForm.flashSaleEnd} onChange={e => setProductForm(f => ({ ...f, flashSaleEnd: e.target.value }))}
                        className="w-full border border-orange-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Tags ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
                <input value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="electronics, wireless, premium, noise-cancelling" />
              </div>

              {/* ── Specifications ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Specifications</p>
                  <button type="button" onClick={() => setFormSpecs(s => [...s, { key: "", value: "" }])}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                    <Plus className="w-3.5 h-3.5" />Add Row
                  </button>
                </div>
                {formSpecs.length === 0 && (
                  <p className="text-xs text-gray-400 italic flex items-center gap-1"><Info className="w-3 h-3" />No specifications yet. Click Add Row to add key-value details like "Color: Black".</p>
                )}
                {formSpecs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={spec.key} onChange={e => setFormSpecs(s => s.map((x, idx) => idx === i ? { ...x, key: e.target.value } : x))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Color" />
                    <input value={spec.value} onChange={e => setFormSpecs(s => s.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Midnight Black" />
                    <button type="button" onClick={() => setFormSpecs(s => s.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Submit ── */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setSortModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submittingProduct} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg,${INDIGO},${INDIGO_LIGHT})` }}>
                  {submittingProduct ? (sortModal === "add" ? "Adding…" : "Saving…") : (sortModal === "add" ? "Add Product" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
