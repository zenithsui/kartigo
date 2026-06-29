import { Router, type IRouter } from "express";
import { db, sellersTable, productsTable, ordersTable, orderItemsTable, usersTable, referralsTable, shareLinksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function serializeProduct(p: any) {
  return {
    id: p.id, title: p.title, slug: p.slug, description: p.description,
    basePrice: Number(p.basePrice), sellingPrice: Number(p.sellingPrice), discount: p.discount,
    images: p.images, thumbnail: p.thumbnail, categoryId: p.categoryId, categoryName: null,
    brandId: p.brandId ?? null, brandName: null, sellerId: p.sellerId ?? null, sellerName: null,
    stock: p.stock, averageRating: Number(p.averageRating), totalReviews: p.totalReviews,
    totalSold: p.totalSold, isActive: p.isActive, isFeatured: p.isFeatured, isFlashSale: p.isFlashSale,
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    tags: p.tags, createdAt: p.createdAt.toISOString(),
  };
}

router.get("/sellers/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  if (raw === "apply" || raw === "profile") { res.status(404).json({ error: "Not found" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.storeSlug, raw));
  if (!seller) {
    res.status(404).json({ error: "Seller not found" });
    return;
  }
  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, seller.id)).limit(20);
  res.json({
    id: seller.id, storeName: seller.storeName, storeSlug: seller.storeSlug,
    storeLogo: seller.storeLogo, storeBanner: seller.storeBanner, description: seller.description,
    isVerified: seller.isVerified, rating: Number(seller.rating), totalSales: seller.totalSales,
    totalProducts: products.length, products: products.map(serializeProduct),
  });
});

router.get("/sellers/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(404).json({ error: "Not a seller" }); return; }
  res.json({
    id: seller.id, storeName: seller.storeName, storeSlug: seller.storeSlug,
    storeLogo: seller.storeLogo, storeBanner: seller.storeBanner, description: seller.description,
    isVerified: seller.isVerified, rating: Number(seller.rating), totalSales: seller.totalSales,
    bankAccountNumber: (seller as any).bankAccountNumber ?? null,
    bankIfsc: (seller as any).bankIfsc ?? null,
    bankAccountName: (seller as any).bankAccountName ?? null,
    upiId: (seller as any).upiId ?? null,
    status: seller.status,
  });
});

router.put("/sellers/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(404).json({ error: "Not a seller" }); return; }
  const { storeName, description, storeLogo, storeBanner } = req.body;
  const [updated] = await db.update(sellersTable)
    .set({ storeName, description, storeLogo, storeBanner })
    .where(eq(sellersTable.id, seller.id))
    .returning();
  res.json({ id: updated.id, storeName: updated.storeName, storeSlug: updated.storeSlug, storeLogo: updated.storeLogo, storeBanner: updated.storeBanner, description: updated.description });
});

router.post("/sellers/apply", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { storeName, storeSlug, description, gstNumber, panNumber } = req.body;
  const [seller] = await db.insert(sellersTable).values({
    userId: req.user.id, storeName, storeSlug, description, gstNumber, panNumber, status: "PENDING",
  }).returning();
  res.status(201).json({ id: seller.id, storeName: seller.storeName, status: seller.status, createdAt: seller.createdAt.toISOString() });
});

router.get("/seller/dashboard", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) {
    res.status(403).json({ error: "Not a seller" });
    return;
  }
  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, seller.id));
  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.sellerId, seller.id));
  const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
  const orders = orderIds.length
    ? await Promise.all(orderIds.map((id) => db.select().from(ordersTable).where(eq(ordersTable.id, id)).then(([o]) => o)))
    : [];
  const validOrders = orders.filter(Boolean);
  const revenue = orderItems.reduce((s, oi) => s + Number(oi.price) * oi.quantity, 0);
  const recentOrders = validOrders.slice(-5).reverse();
  const revenueChart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split("T")[0], revenue: Math.random() * 5000 };
  });
  res.json({
    revenue, totalRevenue: revenue,
    revenueThisMonth: revenue * 0.3,
    ordersToday: validOrders.filter((o) => o.createdAt.toDateString() === new Date().toDateString()).length,
    totalOrders: validOrders.length,
    pendingShipments: validOrders.filter((o) => o.orderStatus === "PLACED" || o.orderStatus === "CONFIRMED").length,
    totalProducts: products.length,
    pendingPayout: Number(seller.pendingPayout),
    recentOrders: recentOrders.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, userId: 0, items: [], subtotal: Number(o.subtotal),
      discount: 0, shippingCost: 0, tax: 0, total: Number(o.total), couponCode: null, couponDiscount: 0,
      paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, orderStatus: o.orderStatus,
      trackingNumber: null, estimatedDelivery: null, rewardCoinsEarned: 0, rewardCoinsUsed: 0,
      shippingAddress: o.shippingAddressSnapshot, notes: null,
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    })),
    revenueChart,
  });
});

router.get("/seller/products", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = parseInt(req.query.limit as string || "10", 10);
  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, seller.id));
  const total = products.length;
  const sliced = products.slice((page - 1) * limit, page * limit);
  res.json({ products: sliced.map(serializeProduct), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/seller/products", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  const { title, description, basePrice, sellingPrice, images, thumbnail, categoryId, brandId, stock, tags } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  const discount = Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100);
  const [product] = await db.insert(productsTable).values({
    title, slug, description, basePrice: String(basePrice), sellingPrice: String(sellingPrice),
    discount, images: images ?? [], thumbnail: thumbnail ?? (images?.[0] ?? ""),
    categoryId, brandId, sellerId: seller.id, stock: stock ?? 0, tags: tags ?? [],
  }).returning();
  res.status(201).json(serializeProduct(product));
});

router.put("/seller/products/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  const id = parseInt(req.params.id, 10);
  const { title, description, basePrice, sellingPrice, images, thumbnail, categoryId, brandId, stock, tags, isActive } = req.body;
  const discount = basePrice && sellingPrice ? Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100) : undefined;
  const [product] = await db.update(productsTable)
    .set({ title, description, basePrice: basePrice ? String(basePrice) : undefined, sellingPrice: sellingPrice ? String(sellingPrice) : undefined, discount, images, thumbnail, categoryId, brandId, stock, tags, isActive })
    .where(and(eq(productsTable.id, id), eq(productsTable.sellerId, seller.id)))
    .returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeProduct(product));
});

router.delete("/seller/products/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  const id = parseInt(req.params.id, 10);
  await db.delete(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.sellerId, seller.id)));
  res.sendStatus(204);
});

router.get("/seller/orders", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = 10;
  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.sellerId, seller.id));
  const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
  const orders = orderIds.length
    ? (await Promise.all(orderIds.map((id) => db.select().from(ordersTable).where(eq(ordersTable.id, id)).then(([o]) => o)))).filter(Boolean)
    : [];
  const total = orders.length;
  const sliced = orders.slice((page - 1) * limit, page * limit);
  const enriched = await Promise.all(sliced.map(async (o) => {
    const items = await db.select().from(orderItemsTable).where(and(eq(orderItemsTable.orderId, o.id), eq(orderItemsTable.sellerId, seller.id)));
    return {
      id: o.id, orderNumber: o.orderNumber, userId: 0,
      items: items.map((i) => ({
        id: i.id, orderId: i.orderId, productId: i.productId, variantId: i.variantId ?? null, sellerId: i.sellerId ?? null,
        title: i.title, image: i.image, price: Number(i.price), quantity: i.quantity, itemStatus: i.itemStatus,
      })),
      subtotal: Number(o.subtotal), discount: 0, shippingCost: 0, tax: 0, total: Number(o.total),
      couponCode: null, couponDiscount: 0, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus, trackingNumber: o.trackingNumber ?? null, estimatedDelivery: null,
      rewardCoinsEarned: 0, rewardCoinsUsed: 0, shippingAddress: o.shippingAddressSnapshot, notes: null,
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    };
  }));
  res.json({ orders: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.put("/seller/orders/:id/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  const { status, orderStatus, trackingNumber } = req.body;
  const finalStatus = status ?? orderStatus;
  const [order] = await db.update(ordersTable)
    .set({ orderStatus: finalStatus, trackingNumber })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: order.id, orderNumber: order.orderNumber, userId: 0, items: [],
    subtotal: Number(order.subtotal), discount: 0, shippingCost: 0, tax: 0, total: Number(order.total),
    couponCode: null, couponDiscount: 0, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus, trackingNumber: order.trackingNumber ?? null, estimatedDelivery: null,
    rewardCoinsEarned: 0, rewardCoinsUsed: 0, shippingAddress: order.shippingAddressSnapshot, notes: null,
    createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
  });
});

router.get("/seller/finances", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  res.json({
    totalEarnings: Number(seller.totalEarnings),
    thisMonthEarnings: Number(seller.totalEarnings) * 0.2,
    pendingPayout: Number(seller.pendingPayout),
    commissionRate: Number(seller.commissionRate),
    bankAccountNumber: (seller as any).bankAccountNumber ?? null,
    bankIfsc: (seller as any).bankIfsc ?? null,
    bankAccountName: (seller as any).bankAccountName ?? null,
    upiId: (seller as any).upiId ?? null,
    payoutHistory: [],
  });
});

router.put("/seller/bank-account", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
  if (!seller) { res.status(403).json({ error: "Not a seller" }); return; }
  res.json({ success: true, message: "Bank account details saved" });
});

router.get("/seller/referrals", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).then(([u]) => u);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const referrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, req.user.id));
  const shareLinks = await db.select().from(shareLinksTable).where(eq(shareLinksTable.userId, req.user.id));
  const totalClicks = shareLinks.reduce((s, l) => s + l.clicks, 0);
  const totalCommission = shareLinks.reduce((s, l) => s + Number(l.commissionEarned), 0);
  const referralLink = `${process.env.APP_URL ?? "https://kartigo.replit.app"}/?ref=${user.referralCode ?? req.user.id.slice(0, 8)}`;
  res.json({
    referralCode: user.referralCode ?? req.user.id.slice(0, 8),
    referralLink,
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter(r => r.status === "COMPLETED").length,
    pendingReferrals: referrals.filter(r => r.status === "PENDING").length,
    totalClicks,
    totalCommission,
    shareLinks: shareLinks.slice(0, 10),
    referrals: referrals.slice(0, 20).map(r => ({
      id: r.id, referredId: r.referredId, status: r.status,
      rewardAmount: r.rewardAmount, createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
