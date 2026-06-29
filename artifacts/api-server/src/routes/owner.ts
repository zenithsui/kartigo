import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, sellersTable, ordersTable, productsTable, platformSettingsTable, activityLogsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";

const router: IRouter = Router();

function isOwner(req: Request, res: Response): boolean {
  if (!req.isAuthenticated() || (req.user as any).role !== "OWNER") {
    res.status(403).json({ error: "Owner access required" });
    return false;
  }
  return true;
}

async function logActivity(req: Request, action: string, entity?: string, entityId?: string, details?: string) {
  const user = req.user as any;
  await db.insert(activityLogsTable).values({
    actorId: user?.id,
    actorEmail: user?.email,
    actorRole: user?.role,
    action,
    entity,
    entityId,
    details,
    ip: req.ip,
  }).catch(() => {});
}

router.get("/owner/dashboard", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable);
  const [sellerCount] = await db.select({ count: count() }).from(sellersTable);
  const orders = await db.select().from(ordersTable);
  const gmv = orders.reduce((s, o) => s + Number(o.total), 0);
  const adminUsers = await db.select().from(usersTable).where(eq(usersTable.role, "ADMIN"));
  const pendingSellers = await db.select().from(sellersTable).where(eq(sellersTable.status, "PENDING"));
  const settings = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "defaultCommissionRate"));
  const commissionRate = settings.length > 0 ? Number(settings[0].value) : 10;
  const revenueChart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split("T")[0], gmv: Math.random() * 200000, commission: Math.random() * 20000, orders: Math.floor(Math.random() * 200) };
  });
  res.json({
    totalUsers: Number(userCount.count),
    totalProducts: Number(productCount.count),
    totalSellers: Number(sellerCount.count),
    totalOrders: orders.length,
    gmv,
    platformRevenue: gmv * (commissionRate / 100),
    adminCount: adminUsers.length,
    pendingSellerCount: pendingSellers.length,
    revenueChart,
  });
});

router.get("/owner/admins", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const admins = await db.select().from(usersTable).where(eq(usersTable.role, "ADMIN"));
  res.json(admins.map(u => ({
    id: u.id, email: u.email,
    name: [u.firstName, u.lastName].filter(Boolean).join(" "),
    isActive: u.isActive, createdAt: u.createdAt,
  })));
});

router.post("/owner/admins", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const { email, firstName, lastName, password } = req.body as Record<string, string>;
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) { res.status(409).json({ error: "User already exists" }); return; }
  const hash = await bcrypt.hash(password, 12);
  const [admin] = await db.insert(usersTable).values({
    email: email.toLowerCase(), firstName, lastName,
    passwordHash: hash, emailVerified: true, role: "ADMIN",
  }).returning();
  await logActivity(req, "CREATE_ADMIN", "user", admin.id, `Created admin: ${email}`);
  res.status(201).json({ id: admin.id, email: admin.email, name: [admin.firstName, admin.lastName].filter(Boolean).join(" "), isActive: admin.isActive, createdAt: admin.createdAt });
});

router.delete("/owner/admins/:id", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const id = String(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user || user.role !== "ADMIN") { res.status(404).json({ error: "Admin not found" }); return; }
  await db.update(usersTable).set({ role: "BUYER", isActive: false }).where(eq(usersTable.id, id));
  await logActivity(req, "DELETE_ADMIN", "user", id, `Revoked admin: ${user.email}`);
  res.json({ success: true });
});

router.put("/owner/admins/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const id = String(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(usersTable).set({ isActive: !user.isActive }).where(eq(usersTable.id, id)).returning();
  await logActivity(req, updated.isActive ? "ENABLE_ADMIN" : "DISABLE_ADMIN", "user", id);
  res.json({ isActive: updated.isActive });
});

router.get("/owner/settings", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const rows = await db.select().from(platformSettingsTable);
  const settings: Record<string, any> = {};
  rows.forEach(r => {
    if (r.value === "true") settings[r.key] = true;
    else if (r.value === "false") settings[r.key] = false;
    else if (!isNaN(Number(r.value))) settings[r.key] = Number(r.value);
    else settings[r.key] = r.value;
  });
  res.json(settings);
});

router.put("/owner/settings", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const body = req.body as Record<string, any>;
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, key));
    if (existing.length > 0) {
      await db.update(platformSettingsTable).set({ value: String(value) }).where(eq(platformSettingsTable.key, key));
    } else {
      await db.insert(platformSettingsTable).values({ key, value: String(value) });
    }
  }
  await logActivity(req, "UPDATE_SETTINGS", "platform", undefined, JSON.stringify(body));
  res.json({ success: true });
});

router.get("/owner/activity-logs", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const logs = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(200);
  res.json(logs);
});

router.get("/owner/sellers", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const sellers = await db.select().from(sellersTable).limit(100);
  res.json(sellers);
});

router.put("/owner/sellers/:id/ban", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [seller] = await db.update(sellersTable).set({ status: "SUSPENDED", isActive: false }).where(eq(sellersTable.id, id)).returning();
  if (!seller) { res.status(404).json({ error: "Not found" }); return; }
  await logActivity(req, "BAN_SELLER", "seller", String(id));
  res.json({ success: true });
});

router.put("/owner/sellers/:id/restore", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const [seller] = await db.update(sellersTable).set({ status: "APPROVED", isActive: true }).where(eq(sellersTable.id, id)).returning();
  if (!seller) { res.status(404).json({ error: "Not found" }); return; }
  await logActivity(req, "RESTORE_SELLER", "seller", String(id));
  res.json({ success: true });
});

router.get("/owner/users", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const users = await db.select().from(usersTable).limit(100);
  res.json(users.map(u => ({
    id: u.id, email: u.email,
    name: [u.firstName, u.lastName].filter(Boolean).join(" "),
    role: u.role, isActive: u.isActive, createdAt: u.createdAt,
  })));
});

router.put("/owner/users/:id/ban", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const id = String(req.params.id);
  const [user] = await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  await logActivity(req, "BAN_USER", "user", id, `Banned: ${user.email}`);
  res.json({ success: true });
});

router.get("/owner/export", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const what = req.query.what as string;
  if (what === "users") {
    const users = await db.select().from(usersTable);
    const csv = ["ID,Email,Role,Active,Created At",
      ...users.map(u => [u.id, u.email, u.role, u.isActive, u.createdAt.toISOString()].join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    return void res.send(csv);
  }
  if (what === "sellers") {
    const sellers = await db.select().from(sellersTable);
    const csv = ["ID,Store Name,Slug,Status,Verified,Total Earnings,Created At",
      ...sellers.map(s => [s.id, `"${s.storeName}"`, s.storeSlug, s.status, s.isVerified, Number(s.totalEarnings).toFixed(2), s.createdAt.toISOString()].join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sellers.csv");
    return void res.send(csv);
  }
  if (what === "orders") {
    const orders = await db.select().from(ordersTable);
    const csv = ["Order #,Status,Payment,Total,Created At",
      ...orders.map(o => [o.orderNumber, o.orderStatus, o.paymentStatus, Number(o.total).toFixed(2), o.createdAt.toISOString()].join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    return void res.send(csv);
  }
  res.status(400).json({ error: "Invalid export type. Use ?what=users|sellers|orders" });
});

// Feature flags — stored as platform_settings with key prefix "flag_"
router.get("/owner/feature-flags", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const rows = await db.select().from(platformSettingsTable);
  const flags: Record<string, boolean> = {
    flashSale: true, referralProgram: true, rewardCoins: true,
    guestCheckout: true, sellerRegistration: true, productReviews: true,
    wishlist: true, coupons: true,
  };
  rows.forEach(r => {
    if (r.key.startsWith("flag_")) {
      const name = r.key.slice(5);
      flags[name] = r.value === "true";
    }
  });
  res.json(flags);
});

router.put("/owner/feature-flags", async (req: Request, res: Response): Promise<void> => {
  if (!isOwner(req, res)) return;
  const body = req.body as Record<string, boolean>;
  for (const [name, value] of Object.entries(body)) {
    const key = `flag_${name}`;
    const existing = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, key));
    if (existing.length > 0) {
      await db.update(platformSettingsTable).set({ value: String(value) }).where(eq(platformSettingsTable.key, key));
    } else {
      await db.insert(platformSettingsTable).values({ key, value: String(value) });
    }
  }
  await logActivity(req, "UPDATE_FEATURE_FLAGS", "platform", undefined, JSON.stringify(body));
  res.json({ success: true });
});

export default router;
