import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard, Users, Store, Settings, ScrollText, LogOut,
  TrendingUp, ShoppingBag, Package, Shield, Plus, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle, Download, Moon, Sun, Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GOLD = "#B45309";
const GOLD_LIGHT = "#D97706";

type Section = "dashboard" | "admins" | "sellers" | "users" | "settings" | "flags" | "logs";

function StatCard({ label, value, icon, sub, dark }: { label: string; value: string; icon: React.ReactNode; sub?: string; dark?: boolean }) {
  return (
    <div className={`${dark ? "bg-gray-800 border-gray-700" : "bg-white border-amber-100"} rounded-2xl p-5 border shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>{icon}</div>
        {sub && <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <p className={`text-2xl font-bold ${dark ? "text-gray-100" : "text-gray-900"}`}>{value}</p>
      <p className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
    </div>
  );
}

function useApi<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error, setData };
}

export default function OwnerPanel() {
  const { user, isLoading, login } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [dark, setDark] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [savingFlags, setSavingFlags] = useState(false);

  const { data: dash, loading: dashLoading } = useApi<any>("/api/owner/dashboard", []);
  const { data: admins, loading: adminsLoading, setData: setAdmins } = useApi<any[]>("/api/owner/admins", [section]);
  const { data: sellers, loading: sellersLoading, setData: setSellers } = useApi<any[]>("/api/owner/sellers", [section]);
  const { data: ownerUsers, loading: usersLoading, setData: setOwnerUsers } = useApi<any[]>("/api/owner/users", [section]);
  const { data: logs, loading: logsLoading } = useApi<any[]>("/api/owner/activity-logs", [section]);

  useEffect(() => {
    if (section === "settings") {
      fetch("/api/owner/settings", { credentials: "include" }).then(r => r.json()).then(setSettings);
    }
    if (section === "flags") {
      fetch("/api/owner/feature-flags", { credentials: "include" }).then(r => r.json()).then(setFlags);
    }
  }, [section]);

  const role = (user as any)?.role;
  const bg = dark ? "bg-gray-900" : "bg-amber-50";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-amber-100";
  const text = dark ? "text-gray-100" : "text-gray-900";
  const subtext = dark ? "text-gray-400" : "text-gray-500";

  if (isLoading) return <div className={`min-h-screen flex items-center justify-center ${bg}`}><div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" /></div>;
  if (!user || role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#451a03,#78350f)" }}>
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fef3c7" }}>
            <Shield className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Owner Access Only</h2>
          <p className="text-gray-500 text-sm mb-6">This panel is restricted to the platform owner.</p>
          <button onClick={login} className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` }}>Sign In</button>
        </div>
      </div>
    );
  }

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "admins", label: "Admins", icon: <Users className="w-5 h-5" /> },
    { id: "sellers", label: "Sellers", icon: <Store className="w-5 h-5" /> },
    { id: "users", label: "All Users", icon: <Users className="w-5 h-5" /> },
    { id: "flags", label: "Feature Flags", icon: <Zap className="w-5 h-5" /> },
    { id: "settings", label: "Platform Settings", icon: <Settings className="w-5 h-5" /> },
    { id: "logs", label: "Activity Logs", icon: <ScrollText className="w-5 h-5" /> },
  ];

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault(); setCreateError(""); setCreating(true);
    const res = await fetch("/api/owner/admins", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newAdmin) });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error ?? "Failed"); }
    else { setAdmins(prev => [...(prev ?? []), data]); setNewAdmin({ email: "", firstName: "", lastName: "", password: "" }); }
    setCreating(false);
  }

  async function deleteAdmin(id: string) {
    if (!confirm("Remove admin access?")) return;
    await fetch(`/api/owner/admins/${id}`, { method: "DELETE", credentials: "include" });
    setAdmins(prev => (prev ?? []).filter(a => a.id !== id));
  }

  async function toggleAdmin(id: string) {
    const res = await fetch(`/api/owner/admins/${id}/toggle`, { method: "PUT", credentials: "include" });
    const data = await res.json();
    setAdmins(prev => (prev ?? []).map(a => a.id === id ? { ...a, isActive: data.isActive } : a));
  }

  async function banSeller(id: number) {
    if (!confirm("Suspend this seller?")) return;
    await fetch(`/api/owner/sellers/${id}/ban`, { method: "PUT", credentials: "include" });
    setSellers(prev => (prev ?? []).map(s => s.id === id ? { ...s, status: "SUSPENDED", isActive: false } : s));
  }

  async function restoreSeller(id: number) {
    await fetch(`/api/owner/sellers/${id}/restore`, { method: "PUT", credentials: "include" });
    setSellers(prev => (prev ?? []).map(s => s.id === id ? { ...s, status: "APPROVED", isActive: true } : s));
  }

  async function banUser(id: string) {
    if (!confirm("Ban this user permanently?")) return;
    await fetch(`/api/owner/users/${id}/ban`, { method: "PUT", credentials: "include" });
    setOwnerUsers(prev => (prev ?? []).map(u => u.id === id ? { ...u, isActive: false } : u));
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setSavingSettings(true);
    await fetch("/api/owner/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(settings) });
    setSavingSettings(false);
    alert("Settings saved!");
  }

  async function saveFlags() {
    setSavingFlags(true);
    await fetch("/api/owner/feature-flags", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(flags) });
    setSavingFlags(false);
    alert("Feature flags updated!");
  }

  function exportData(what: string) {
    window.open(`/api/owner/export?what=${what}`, "_blank");
  }

  const FLAG_LABELS: Record<string, string> = {
    flashSale: "Flash Sales",
    referralProgram: "Referral Program",
    rewardCoins: "Reward Coins",
    guestCheckout: "Guest Checkout",
    sellerRegistration: "Seller Registration",
    productReviews: "Product Reviews",
    wishlist: "Wishlist",
    coupons: "Coupons",
  };

  const Sidebar = () => (
    <aside className="w-64 min-h-screen flex flex-col shrink-0" style={{ background: "linear-gradient(180deg,#451a03 0%,#78350f 100%)" }}>
      <div className="p-6 border-b border-amber-900/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>Owner Panel</span>
        </div>
        <p className="text-amber-300/60 text-xs mt-1">{(user as any).email}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${section === item.id ? "text-white" : "text-amber-200 hover:bg-amber-900/30"}`} style={section === item.id ? { background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` } : {}}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-amber-900/30 space-y-2">
        <button onClick={() => setDark(d => !d)} className="flex items-center gap-2 text-amber-300/60 text-sm hover:text-amber-300 w-full">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "Light Mode" : "Dark Mode"}
        </button>
        <a href="/" className="flex items-center gap-2 text-amber-300/60 text-sm hover:text-amber-300 transition">
          <LogOut className="w-4 h-4" /> Back to Store
        </a>
      </div>
    </aside>
  );

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl">

          {/* ── Dashboard ── */}
          {section === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Platform Overview</h1>
                  <p className={`${subtext} text-sm mt-1`}>Live performance snapshot</p>
                </div>
                <div className="flex gap-2">
                  {["users", "sellers", "orders"].map(w => (
                    <button key={w} onClick={() => exportData(w)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-50 bg-white">
                      <Download className="w-3.5 h-3.5" />Export {w}
                    </button>
                  ))}
                </div>
              </div>
              {dashLoading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total GMV" value={formatCurrency(dash?.gmv ?? 0)} icon={<TrendingUp className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                  <StatCard label="Platform Revenue" value={formatCurrency(dash?.platformRevenue ?? 0)} icon={<TrendingUp className="w-5 h-5" style={{ color: GOLD }} />} sub="commission" dark={dark} />
                  <StatCard label="Total Orders" value={(dash?.totalOrders ?? 0).toLocaleString()} icon={<ShoppingBag className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                  <StatCard label="Total Users" value={(dash?.totalUsers ?? 0).toLocaleString()} icon={<Users className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                  <StatCard label="Active Sellers" value={(dash?.totalSellers ?? 0).toLocaleString()} icon={<Store className="w-5 h-5" style={{ color: GOLD }} />} sub={`${dash?.pendingSellerCount ?? 0} pending`} dark={dark} />
                  <StatCard label="Products" value={(dash?.totalProducts ?? 0).toLocaleString()} icon={<Package className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                  <StatCard label="Admin Accounts" value={(dash?.adminCount ?? 0).toLocaleString()} icon={<Shield className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                  <StatCard label="Pending Approvals" value={(dash?.pendingSellerCount ?? 0).toLocaleString()} icon={<AlertTriangle className="w-5 h-5" style={{ color: GOLD }} />} dark={dark} />
                </div>
              )}
              {dash?.revenueChart && (
                <div className={`${card} rounded-2xl p-6 border`}>
                  <h3 className={`font-semibold ${text} mb-4`}>30-Day GMV & Commission</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dash.revenueChart}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="gmv" fill="#D97706" radius={[4, 4, 0, 0]} name="GMV" />
                      <Bar dataKey="commission" fill="#B45309" radius={[4, 4, 0, 0]} name="Commission" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── Admins ── */}
          {section === "admins" && (
            <div className="space-y-6">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Admin Accounts</h1>
              <div className={`${card} rounded-2xl border p-6`}>
                <h3 className={`font-semibold ${text} mb-4 flex items-center gap-2`}><Plus className="w-4 h-4" />Create New Admin</h3>
                <form onSubmit={createAdmin} className="grid grid-cols-2 gap-3">
                  <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Email" type="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} required />
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="First name" value={newAdmin.firstName} onChange={e => setNewAdmin(p => ({ ...p, firstName: e.target.value }))} />
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Last name" value={newAdmin.lastName} onChange={e => setNewAdmin(p => ({ ...p, lastName: e.target.value }))} />
                  <input className="col-span-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Password (min 8 chars)" type="password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} required minLength={8} />
                  {createError && <p className="col-span-2 text-sm text-red-600">{createError}</p>}
                  <button type="submit" disabled={creating} className="col-span-2 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` }}>{creating ? "Creating…" : "Create Admin Account"}</button>
                </form>
              </div>
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <table className="w-full">
                  <thead><tr className="bg-amber-50 border-b border-amber-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name / Email</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody>
                    {adminsLoading ? <tr><td colSpan={3} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                      (admins ?? []).length === 0 ? <tr><td colSpan={3} className="text-center py-10 text-gray-400">No admins yet</td></tr> :
                        (admins ?? []).map(a => (
                          <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3"><p className={`font-medium text-sm ${text}`}>{a.name || "—"}</p><p className="text-xs text-gray-500">{a.email}</p></td>
                            <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{a.isActive ? "Active" : "Disabled"}</span></td>
                            <td className="px-5 py-3 flex gap-2">
                              <button onClick={() => toggleAdmin(a.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200" title="Toggle active">{a.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}</button>
                              <button onClick={() => deleteAdmin(a.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sellers ── */}
          {section === "sellers" && (
            <div className="space-y-4">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>All Sellers</h1>
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <table className="w-full">
                  <thead><tr className="bg-amber-50 border-b border-amber-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Store</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody>
                    {sellersLoading ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                      (sellers ?? []).length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No sellers yet</td></tr> :
                        (sellers ?? []).map(s => (
                          <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3"><p className={`font-medium text-sm ${text}`}>{s.storeName}</p><p className="text-xs text-gray-500">/{s.storeSlug}</p></td>
                            <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status === "APPROVED" ? "bg-green-100 text-green-700" : s.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{s.status}</span></td>
                            <td className="px-5 py-3 text-sm">{formatCurrency(Number(s.totalEarnings ?? 0))}</td>
                            <td className="px-5 py-3 text-sm">{Number(s.commissionRate ?? 10)}%</td>
                            <td className="px-5 py-3 flex gap-2">
                              {s.status === "SUSPENDED" ? (
                                <button onClick={() => restoreSeller(s.id)} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">Restore</button>
                              ) : (
                                <button onClick={() => banSeller(s.id)} className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Ban</button>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── All Users ── */}
          {section === "users" && (
            <div className="space-y-4">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>All Users</h1>
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <table className="w-full">
                  <thead><tr className="bg-amber-50 border-b border-amber-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody>
                    {usersLoading ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                      (ownerUsers ?? []).map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3"><p className={`font-medium text-sm ${text}`}>{u.name || "—"}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                          <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${u.role === "OWNER" ? "bg-amber-100 text-amber-700" : u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : u.role === "SELLER" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span></td>
                          <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{u.isActive ? "Active" : "Banned"}</span></td>
                          <td className="px-5 py-3">
                            {u.role !== "OWNER" && u.isActive && (
                              <button onClick={() => banUser(u.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Ban</button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Feature Flags ── */}
          {section === "flags" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Feature Flags</h1>
                <p className={`${subtext} text-sm mt-1`}>Toggle platform features on/off without code changes.</p>
              </div>
              <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                {Object.entries(FLAG_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className={`font-medium text-sm ${text}`}>{label}</p>
                      <p className={`text-xs ${subtext}`}>Feature key: {key}</p>
                    </div>
                    <button
                      onClick={() => setFlags(f => ({ ...f, [key]: !f[key] }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${flags[key] !== false ? "bg-amber-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${flags[key] !== false ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={saveFlags} disabled={savingFlags} className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` }}>
                {savingFlags ? "Saving…" : "Save Feature Flags"}
              </button>
            </div>
          )}

          {/* ── Settings ── */}
          {section === "settings" && (
            <div className="space-y-6">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Platform Settings</h1>
              <form onSubmit={saveSettings} className="space-y-4">
                <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                  <h3 className={`font-semibold ${text}`}>Commerce</h3>
                  {[
                    { key: "defaultCommissionRate", label: "Default Commission %", type: "number" },
                    { key: "shippingFreeThreshold", label: "Free Shipping Above (₹)", type: "number" },
                    { key: "shippingBaseCost", label: "Base Shipping Cost (₹)", type: "number" },
                    { key: "taxRate", label: "Tax Rate (%)", type: "number" },
                    { key: "codFee", label: "COD Fee (₹)", type: "number" },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-4">
                      <label className={`text-sm ${subtext} w-56`}>{f.label}</label>
                      <input type={f.type} value={settings[f.key] ?? ""} onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  ))}
                </div>
                <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                  <h3 className={`font-semibold ${text}`}>Branding & Contact</h3>
                  {[
                    { key: "siteName", label: "Site Name", type: "text" },
                    { key: "siteLogoUrl", label: "Logo URL", type: "url" },
                    { key: "faviconUrl", label: "Favicon URL", type: "url" },
                    { key: "contactEmail", label: "Contact Email", type: "email" },
                    { key: "supportPhone", label: "Support Phone", type: "text" },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-4">
                      <label className={`text-sm ${subtext} w-56`}>{f.label}</label>
                      <input type={f.type} value={settings[f.key] ?? ""} onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  ))}
                </div>
                <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                  <h3 className={`font-semibold ${text}`}>Payment Keys</h3>
                  <p className={`text-xs ${subtext}`}>These keys are saved securely and used for payment processing.</p>
                  {[
                    { key: "razorpayKeyId", label: "Razorpay Key ID", type: "text" },
                    { key: "razorpayKeySecret", label: "Razorpay Key Secret", type: "password" },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-4">
                      <label className={`text-sm ${subtext} w-56`}>{f.label}</label>
                      <input type={f.type} value={settings[f.key] ?? ""} onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="••••••••••••" />
                    </div>
                  ))}
                </div>
                <div className={`${card} rounded-2xl border p-6 space-y-4`}>
                  <h3 className={`font-semibold ${text}`}>Platform Control</h3>
                  <div className="flex items-center gap-4">
                    <label className={`text-sm ${subtext} w-56`}>Maintenance Mode</label>
                    <button type="button" onClick={() => setSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} className={`relative w-12 h-6 rounded-full transition-colors ${settings["maintenanceMode"] ? "bg-red-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings["maintenanceMode"] ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                    {settings["maintenanceMode"] && <span className="text-xs text-red-600 font-medium">⚠️ Site is in maintenance mode</span>}
                  </div>
                </div>
                <button type="submit" disabled={savingSettings} className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` }}>{savingSettings ? "Saving…" : "Save All Settings"}</button>
              </form>
            </div>
          )}

          {/* ── Activity Logs ── */}
          {section === "logs" && (
            <div className="space-y-4">
              <h1 className={`text-2xl font-bold ${text}`} style={{ fontFamily: "Outfit, sans-serif" }}>Activity Logs</h1>
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <table className="w-full">
                  <thead><tr className="bg-amber-50 border-b border-amber-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actor</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Details</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th></tr></thead>
                  <tbody>
                    {logsLoading ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr> :
                      (logs ?? []).length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">No activity yet</td></tr> :
                        (logs ?? []).map(l => (
                          <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3 text-sm"><p className={`font-medium ${text}`}>{l.actorEmail ?? "—"}</p><span className="text-xs text-gray-500">{l.actorRole}</span></td>
                            <td className="px-5 py-3"><span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{l.action}</span></td>
                            <td className="px-5 py-3 text-xs text-gray-500 max-w-xs truncate">{l.details ?? l.entity ?? "—"}</td>
                            <td className="px-5 py-3 text-xs text-gray-500">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
