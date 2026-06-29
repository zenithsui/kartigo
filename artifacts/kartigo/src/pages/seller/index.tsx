import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard, Package, ShoppingBag, Wallet, Store, LogOut,
  Plus, Pencil, Upload, X, ChevronLeft, ChevronRight, TrendingUp,
  Trash2, Share2, Moon, Sun, CreditCard, Printer,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const EMERALD = "#059669";
const EMERALD_LIGHT = "#10B981";

type Section = "dashboard" | "products" | "orders" | "payouts" | "store" | "referrals";
const ORDER_STATUSES = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

function useFetch<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const fetch_ = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url, enabled]);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, setData, refetch: fetch_ };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-700", SHIPPED: "bg-purple-100 text-purple-700",
    PLACED: "bg-blue-100 text-blue-700", CONFIRMED: "bg-cyan-100 text-cyan-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export default function SellerPanel() {
  const { user, isLoading, login } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [dark, setDark] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({ title: "", sellingPrice: "", basePrice: "", stock: "", description: "" });
  const [productImgUrl, setProductImgUrl] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const storeBannerRef = useRef<HTMLInputElement>(null);
  const storeLogoRef = useRef<HTMLInputElement>(null);
  const [storeForm, setStoreForm] = useState({ storeName: "", description: "", storeLogo: "", storeBanner: "" });
  const [savingStore, setSavingStore] = useState(false);
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifsc: "", accountName: "", upiId: "" });
  const [savingBank, setSavingBank] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const role = (user as any)?.role;
  const isAllowed = role === "SELLER" || role === "ADMIN" || role === "OWNER";

  const bg = dark ? "bg-gray-900" : "bg-emerald-50";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-emerald-100";
  const text = dark ? "text-gray-100" : "text-gray-900";
  const subtext = dark ? "text-gray-400" : "text-gray-500";

  const { data: dash, loading: dashLoading } = useFetch<any>("/api/seller/dashboard", isAllowed);
  const { data: products, loading: productsLoading, setData: setProducts } = useFetch<any>(`/api/seller/products?page=${productPage}`, isAllowed && section === "products");
  const { data: orders, loading: ordersLoading } = useFetch<any>(`/api/seller/orders?page=${orderPage}`, isAllowed && section === "orders");
  const { data: finances } = useFetch<any>("/api/seller/finances", isAllowed && section === "payouts");
  const { data: store, setData: setStore } = useFetch<any>("/api/sellers/profile", isAllowed && section === "store");
  const { data: referralData } = useFetch<any>("/api/seller/referrals", isAllowed && section === "referrals");

  useEffect(() => {
    if (store && !store.error) {
      setStoreForm({ storeName: store.storeName ?? "", description: store.description ?? "", storeLogo: store.storeLogo ?? "", storeBanner: store.storeBanner ?? "" });
    }
  }, [store]);

  useEffect(() => {
    if (finances) {
      setBankForm({
        accountNumber: finances.bankAccountNumber ?? "",
        ifsc: finances.bankIfsc ?? "",
        accountName: finances.bankAccountName ?? "",
        upiId: finances.upiId ?? "",
      });
    }
  }, [finances]);

  if (isLoading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
    </div>
  );

  if (!user || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#022c22,#065f46)" }}>
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Seller Access Required</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in with your seller account to continue.</p>
          <button onClick={login} className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}>Sign In</button>
          <p className="mt-4 text-sm text-gray-400">Not a seller yet? <a href="/sell-on-kartigo" className="text-emerald-600 hover:underline">Apply here</a></p>
        </div>
      </div>
    );
  }

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "products", label: "My Products", icon: <Package className="w-5 h-5" /> },
    { id: "orders", label: "My Orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "payouts", label: "Payouts", icon: <Wallet className="w-5 h-5" /> },
    { id: "store", label: "My Store", icon: <Store className="w-5 h-5" /> },
    { id: "referrals", label: "Referrals", icon: <Share2 className="w-5 h-5" /> },
  ];

  async function uploadImage() {
    const file = imgFileRef.current?.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("folder", "kartigo/products");
    const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (res.ok) setProductImgUrl(data.url);
    setUploadingImg(false);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSavingProduct(true);
    const body = {
      ...productForm,
      sellingPrice: Number(productForm.sellingPrice),
      basePrice: Number(productForm.basePrice),
      stock: Number(productForm.stock),
      ...(productImgUrl ? { images: [productImgUrl], thumbnail: productImgUrl } : {}),
    };
    const url = editingProduct ? `/api/seller/products/${editingProduct.id}` : "/api/seller/products";
    const method = editingProduct ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      if (editingProduct) {
        setProducts((prev: any) => prev ? { ...prev, products: prev.products.map((p: any) => p.id === data.id ? data : p) } : prev);
      } else {
        setProducts((prev: any) => prev ? { ...prev, products: [data, ...prev.products] } : { products: [data] });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ title: "", sellingPrice: "", basePrice: "", stock: "", description: "" });
      setProductImgUrl("");
    }
    setSavingProduct(false);
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/seller/products/${id}`, { method: "DELETE", credentials: "include" });
    setProducts((prev: any) => prev ? { ...prev, products: prev.products.filter((p: any) => p.id !== id) } : prev);
  }

  function openEdit(p: any) {
    setEditingProduct(p);
    setProductForm({ title: p.title, sellingPrice: String(p.sellingPrice), basePrice: String(p.basePrice), stock: String(p.stock), description: p.description ?? "" });
    setProductImgUrl(p.thumbnail ?? "");
    setShowProductForm(true);
  }

  async function updateOrderStatus(id: string, orderStatus: string) {
    await fetch(`/api/seller/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderStatus }),
    });
  }

  function printInvoice(o: any) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${o.orderNumber}</title>
      <style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:auto}h1{font-size:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style>
      </head><body>
      <h1>Invoice</h1><p><strong>Order #:</strong> ${o.orderNumber}</p>
      <p><strong>Status:</strong> ${o.orderStatus}</p><p><strong>Payment:</strong> ${o.paymentStatus} via ${o.paymentMethod}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>
      ${(o.items ?? []).map((i: any) => `<tr><td>${i.title}</td><td>${i.quantity}</td><td>₹${(i.price * i.quantity).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>
      <p style="margin-top:16px;font-size:18px;font-weight:bold">Total: ₹${Number(o.total).toFixed(2)}</p>
      <script>window.onload=()=>{window.print();window.close();}</script></body></html>
    `);
    win.document.close();
  }

  async function saveStore(e: React.FormEvent) {
    e.preventDefault(); setSavingStore(true);
    const res = await fetch("/api/sellers/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(storeForm) });
    if (res.ok) { const d = await res.json(); setStore((prev: any) => ({ ...prev, ...d })); }
    setSavingStore(false);
    alert("Store updated!");
  }

  async function uploadStoreMedia(type: "logo" | "banner") {
    const ref = type === "logo" ? storeLogoRef : storeBannerRef;
    const file = ref.current?.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append("image", file); fd.append("folder", "kartigo/stores");
    const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (res.ok) setStoreForm(p => ({ ...p, [type === "logo" ? "storeLogo" : "storeBanner"]: data.url }));
  }

  async function saveBankAccount(e: React.FormEvent) {
    e.preventDefault(); setSavingBank(true);
    await fetch("/api/seller/bank-account", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(bankForm) });
    setSavingBank(false);
    alert("Bank account details saved!");
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(referralData?.referralLink ?? "");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <aside className="w-60 min-h-screen shrink-0 flex flex-col" style={{ background: "linear-gradient(180deg,#022c22 0%,#065f46 100%)" }}>
        <div className="p-5 border-b border-emerald-900/30">
          <span className="font-bold text-white text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>🏪 Seller Panel</span>
          <p className="text-emerald-300/60 text-xs mt-1 truncate">{(user as any).email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.id ? "bg-white text-emerald-900" : "text-emerald-200 hover:bg-emerald-900/30"}`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-emerald-900/30 space-y-2">
          <button onClick={() => setDark(d => !d)} className="flex items-center gap-2 text-emerald-300/60 text-sm hover:text-emerald-200 w-full">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "Light Mode" : "Dark Mode"}
          </button>
          <a href="/" className="flex items-center gap-2 text-emerald-300/60 text-sm hover:text-emerald-200 transition">
            <LogOut className="w-4 h-4" />Back to Store
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">

        {/* ── Dashboard ── */}
        {section === "dashboard" && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>
                Welcome back{(user as any).firstName ? `, ${(user as any).firstName}` : ""}! 👋
              </h1>
              <p className={`${subtext} text-sm mt-1`}>Your store performance at a glance.</p>
            </div>

            {dashLoading
              ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>
              : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    { label: "Total Revenue", value: formatCurrency(dash?.totalRevenue ?? dash?.revenue ?? 0), icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
                    { label: "Total Orders", value: String((dash?.totalOrders ?? 0).toLocaleString()), icon: <ShoppingBag className="w-5 h-5 text-emerald-600" /> },
                    { label: "My Products", value: String((dash?.totalProducts ?? 0).toLocaleString()), icon: <Package className="w-5 h-5 text-emerald-600" /> },
                    { label: "Pending Payout", value: formatCurrency(dash?.pendingPayout ?? 0), icon: <Wallet className="w-5 h-5 text-emerald-600" /> },
                  ] as { label: string; value: string; icon: React.ReactNode }[]).map(c => (
                    <div key={c.label} className={`${card} rounded-2xl p-5 border shadow-sm`}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">{c.icon}</div>
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
                    <Bar dataKey="revenue" fill={EMERALD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── Products ── */}
        {section === "products" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>My Products</h1>
              <button
                onClick={() => { setEditingProduct(null); setProductForm({ title: "", sellingPrice: "", basePrice: "", stock: "", description: "" }); setProductImgUrl(""); setShowProductForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}
              >
                <Plus className="w-4 h-4" />Add Product
              </button>
            </div>

            {showProductForm && (
              <div className={`${card} rounded-2xl border p-6 relative`}>
                <button onClick={() => setShowProductForm(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
                <h3 className={`font-semibold ${text} mb-4`}>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <form onSubmit={saveProduct} className="grid grid-cols-2 gap-3">
                  <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Product title" value={productForm.title} onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))} required />
                  <input type="number" className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Selling price (₹)" value={productForm.sellingPrice} onChange={e => setProductForm(p => ({ ...p, sellingPrice: e.target.value }))} required />
                  <input type="number" className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="MRP / Base price (₹)" value={productForm.basePrice} onChange={e => setProductForm(p => ({ ...p, basePrice: e.target.value }))} required />
                  <input type="number" className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Stock quantity" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} required />
                  <div className="border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <input type="file" accept="image/*" ref={imgFileRef} className="hidden" id="product-img" onChange={uploadImage} />
                    <label htmlFor="product-img" className="cursor-pointer text-emerald-600 hover:underline text-sm flex items-center gap-1.5 flex-1">
                      <Upload className="w-4 h-4 shrink-0" />
                      {uploadingImg ? "Uploading…" : productImgUrl ? "Change image" : "Upload image"}
                    </label>
                    {productImgUrl && <img src={productImgUrl} alt="" className="w-8 h-8 rounded object-cover" />}
                  </div>
                  <textarea className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={2} placeholder="Description (optional)" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                  <button type="submit" disabled={savingProduct} className="col-span-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60" style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}>
                    {savingProduct ? "Saving…" : editingProduct ? "Save Changes" : "Add Product"}
                  </button>
                </form>
              </div>
            )}

            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading
                    ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr>
                    : ((products?.products ?? []) as any[]).map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.thumbnail ?? ""} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                            <span className={`text-sm font-medium ${text} max-w-xs truncate`}>{p.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm">{formatCurrency(p.sellingPrice)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-medium ${p.stock <= 5 ? "text-red-600" : "text-gray-700"}`}>
                            {p.stock}{p.stock <= 5 && p.stock > 0 ? " ⚠️" : p.stock === 0 ? " 🚫" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3 flex gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100">
                            <Pencil className="w-4 h-4 text-emerald-700" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-emerald-100">
                <span className="text-xs text-gray-500">{products?.total ?? 0} products</span>
                <div className="flex gap-2">
                  <button disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={productPage >= (products?.totalPages ?? 1)} onClick={() => setProductPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {section === "orders" && (
          <div className="space-y-4 max-w-5xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>My Orders</h1>
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Update</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading
                    ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
                    : ((orders?.orders ?? orders ?? []) as any[]).map((o: any) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-mono text-gray-700">{o.orderNumber ?? o.id}</td>
                        <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(o.total)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td>
                        <td className="px-5 py-3">
                          <select defaultValue={o.orderStatus} onChange={e => updateOrderStatus(o.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => printInvoice(o)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200" title="Print Invoice">
                            <Printer className="w-4 h-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-emerald-100">
                <span className="text-xs text-gray-500">{orders?.total ?? 0} orders</span>
                <div className="flex gap-2">
                  <button disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={orderPage >= (orders?.totalPages ?? 1)} onClick={() => setOrderPage(p => p + 1)} className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payouts ── */}
        {section === "payouts" && (
          <div className="space-y-6 max-w-2xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Payouts</h1>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "Total Earned", value: formatCurrency(finances?.totalEarnings ?? 0) },
                { label: "This Month", value: formatCurrency(finances?.thisMonthEarnings ?? 0) },
                { label: "Pending Payout", value: formatCurrency(finances?.pendingPayout ?? 0) },
                { label: "Commission Rate", value: `${finances?.commissionRate ?? 10}%` },
              ] as { label: string; value: string }[]).map(c => (
                <div key={c.label} className={`${card} rounded-2xl border p-5`}>
                  <p className={`text-2xl font-bold ${text}`}>{c.value}</p>
                  <p className={`text-sm ${subtext} mt-1`}>{c.label}</p>
                </div>
              ))}
            </div>
            <div className={`${card} rounded-2xl border p-6`}>
              <h3 className={`font-semibold ${text} mb-4 flex items-center gap-2`}>
                <CreditCard className="w-4 h-4" />Bank Account Details
              </h3>
              <form onSubmit={saveBankAccount} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Account holder name" value={bankForm.accountName} onChange={e => setBankForm(p => ({ ...p, accountName: e.target.value }))} />
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Account number" value={bankForm.accountNumber} onChange={e => setBankForm(p => ({ ...p, accountNumber: e.target.value }))} />
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="IFSC code" value={bankForm.ifsc} onChange={e => setBankForm(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))} />
                  <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="UPI ID (optional)" value={bankForm.upiId} onChange={e => setBankForm(p => ({ ...p, upiId: e.target.value }))} />
                </div>
                <button type="submit" disabled={savingBank} className="w-full py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}>
                  {savingBank ? "Saving…" : "Save Bank Details"}
                </button>
              </form>
            </div>
            <div className={`${card} rounded-2xl border p-6`}>
              <h3 className={`font-semibold ${text} mb-3`}>Payout History</h3>
              {(finances?.payoutHistory ?? []).length === 0
                ? <p className={`text-sm ${subtext}`}>No payouts processed yet. Payouts are released weekly after order delivery.</p>
                : <p className={`text-sm ${subtext}`}>History will appear here.</p>
              }
            </div>
          </div>
        )}

        {/* ── Store ── */}
        {section === "store" && (
          <div className="space-y-4 max-w-2xl">
            <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>My Store</h1>
            {store && !store.error ? (
              <>
                <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                  <h3 className={`font-semibold ${text} mb-2`}>Store Profile</h3>
                  <form onSubmit={saveStore} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Store name" value={storeForm.storeName} onChange={e => setStoreForm(p => ({ ...p, storeName: e.target.value }))} />
                      <textarea className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none" rows={3} placeholder="Store description" value={storeForm.description} onChange={e => setStoreForm(p => ({ ...p, description: e.target.value }))} />
                      <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5">
                        <input type="file" accept="image/*" ref={storeLogoRef} className="hidden" id="store-logo" onChange={() => uploadStoreMedia("logo")} />
                        <label htmlFor="store-logo" className="cursor-pointer text-emerald-600 text-sm hover:underline flex items-center gap-1.5 flex-1">
                          <Upload className="w-4 h-4 shrink-0" />Upload Logo
                        </label>
                        {storeForm.storeLogo && <img src={storeForm.storeLogo} alt="" className="w-8 h-8 rounded object-cover" />}
                      </div>
                      <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5">
                        <input type="file" accept="image/*" ref={storeBannerRef} className="hidden" id="store-banner" onChange={() => uploadStoreMedia("banner")} />
                        <label htmlFor="store-banner" className="cursor-pointer text-emerald-600 text-sm hover:underline flex items-center gap-1.5 flex-1">
                          <Upload className="w-4 h-4 shrink-0" />Upload Banner
                        </label>
                        {storeForm.storeBanner && <img src={storeForm.storeBanner} alt="" className="w-16 h-8 rounded object-cover" />}
                      </div>
                    </div>
                    <button type="submit" disabled={savingStore} className="w-full py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}>
                      {savingStore ? "Saving…" : "Save Store Profile"}
                    </button>
                  </form>
                </div>
                <div className={`${card} rounded-2xl border p-6`}>
                  <div className="flex items-center gap-4">
                    {store.storeLogo && <img src={store.storeLogo} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />}
                    <div>
                      <h3 className={`text-lg font-bold ${text}`}>{store.storeName}</h3>
                      <p className="text-sm text-emerald-600">kartigo.replit.app/sellers/{store.storeSlug}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mt-3">
                    <span>⭐ {Number(store.rating ?? 0).toFixed(1)} rating</span>
                    <span>📦 {store.totalSales ?? 0} total sales</span>
                    <span>{store.isVerified ? "✅ Verified" : "⏳ Pending"}</span>
                  </div>
                  <a href={`/sellers/${store.storeSlug}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline font-medium">
                    View public store →
                  </a>
                </div>
              </>
            ) : (
              <div className={`${card} rounded-2xl border p-6 text-center py-8`}>
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className={`text-sm ${subtext}`}>No seller store found for your account.</p>
                <a href="/sell-on-kartigo" className="mt-4 inline-block px-6 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}>
                  Apply to Sell
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Referrals ── */}
        {section === "referrals" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Referrals & Share Earnings</h1>
              <p className={`${subtext} text-sm mt-1`}>Share your link and earn commission on every referral.</p>
            </div>

            <div className={`${card} rounded-2xl border p-6`}>
              <h3 className={`font-semibold ${text} mb-3`}>Your Referral Link</h3>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralData?.referralLink ?? "Loading…"}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 font-mono"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold whitespace-nowrap"
                  style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_LIGHT})` }}
                >
                  {copiedLink ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <p className={`text-xs ${subtext} mt-2`}>Code: <span className="font-mono font-bold">{referralData?.referralCode ?? "—"}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "Total Referrals", value: String(referralData?.totalReferrals ?? 0) },
                { label: "Completed", value: String(referralData?.completedReferrals ?? 0) },
                { label: "Total Clicks", value: String(referralData?.totalClicks ?? 0) },
                { label: "Commission Earned", value: formatCurrency(referralData?.totalCommission ?? 0) },
              ] as { label: string; value: string }[]).map(c => (
                <div key={c.label} className={`${card} rounded-2xl border p-5`}>
                  <p className={`text-2xl font-bold ${text}`}>{c.value}</p>
                  <p className={`text-sm ${subtext} mt-1`}>{c.label}</p>
                </div>
              ))}
            </div>

            {(referralData?.referrals ?? []).length > 0 && (
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <div className={`px-5 py-4 border-b border-gray-100`}><h3 className={`font-semibold ${text}`}>Referral History</h3></div>
                <table className="w-full">
                  <thead><tr className="bg-emerald-50 border-b border-emerald-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reward</th></tr></thead>
                  <tbody>
                    {(referralData.referrals as any[]).map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${r.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                        <td className="px-5 py-3 text-sm font-semibold text-emerald-700">{r.rewardAmount > 0 ? `+${r.rewardAmount} coins` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={`${card} rounded-2xl border p-6`}>
              <h3 className={`font-semibold ${text} mb-2`}>How It Works</h3>
              <ol className={`text-sm ${subtext} space-y-2 list-decimal list-inside`}>
                <li>Share your unique referral link with friends or on social media</li>
                <li>When someone signs up and places their first order, you earn reward coins</li>
                <li>Coins can be redeemed for discounts on future orders</li>
                <li>No limit — the more you refer, the more you earn!</li>
              </ol>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
