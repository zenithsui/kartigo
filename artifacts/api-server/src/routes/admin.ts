import { Router, type IRouter } from "express";
import { db, usersTable, productsTable, ordersTable, orderItemsTable, reviewsTable, sellersTable, couponsTable, platformSettingsTable, categoriesTable, bannersTable } from "@workspace/db";
import { eq, count, lte } from "drizzle-orm";

const router: IRouter = Router();

function isAdmin(req: any, res: any): boolean {
  const role = req.user?.role;
  if (!req.isAuthenticated() || (role !== "ADMIN" && role !== "OWNER")) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

function serializeUser(u: any) {
  return {
    id: 0, replitId: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
    email: u.email, phone: u.phone, avatar: u.profileImageUrl,
    role: u.role, rewardCoins: u.rewardCoins, referralCode: u.referralCode,
    isActive: u.isActive, createdAt: u.createdAt.toISOString(),
  };
}

function serializeProduct(p: any) {
  return {
    id: p.id, title: p.title, slug: p.slug,
    description: p.description, richDescription: p.richDescription ?? "",
    sku: p.sku ?? "", weight: p.weight ? Number(p.weight) : null,
    specifications: p.specifications ?? {},
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

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const users = await db.select({ count: count() }).from(usersTable);
  const products = await db.select({ count: count() }).from(productsTable);
  const sellers = await db.select({ count: count() }).from(sellersTable);
  const orders = await db.select().from(ordersTable);
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const topProducts = await db.select().from(productsTable).orderBy(productsTable.totalSold).limit(5);
  const recentOrders = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  const lowStock = await db.select().from(productsTable).where(lte(productsTable.stock, 5));
  const revenueChart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split("T")[0], revenue: Math.random() * 50000, orders: Math.floor(Math.random() * 50) };
  });
  res.json({
    totalUsers: Number(users[0].count),
    totalOrders: orders.length,
    totalRevenue: revenue,
    totalProducts: Number(products[0].count),
    totalSellers: Number(sellers[0].count),
    ordersToday: orders.filter((o) => o.createdAt.toDateString() === new Date().toDateString()).length,
    revenueToday: orders.filter((o) => o.createdAt.toDateString() === new Date().toDateString()).reduce((s, o) => s + Number(o.total), 0),
    revenueChart,
    lowStockProducts: lowStock.map(serializeProduct),
    recentOrders: recentOrders.map((o) => ({
      id: o.id, orderNumber: o.orderNumber, userId: 0, items: [], subtotal: Number(o.subtotal),
      discount: 0, shippingCost: 0, tax: 0, total: Number(o.total), couponCode: null, couponDiscount: 0,
      paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, orderStatus: o.orderStatus,
      trackingNumber: null, estimatedDelivery: null, rewardCoinsEarned: 0, rewardCoinsUsed: 0,
      shippingAddress: o.shippingAddressSnapshot, notes: null,
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    })),
    topProducts: topProducts.map(serializeProduct),
  });
});

router.get("/admin/users", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = 20;
  let users = await db.select().from(usersTable);
  users = users.filter((u) => u.role !== "OWNER");
  if (req.query.role) users = users.filter((u) => u.role === req.query.role);
  if (req.query.q) {
    const q = (req.query.q as string).toLowerCase();
    users = users.filter((u) => u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q));
  }
  const total = users.length;
  const sliced = users.slice((page - 1) * limit, page * limit);
  res.json({ users: sliced.map(serializeUser), total, page, totalPages: Math.ceil(total / limit) });
});

router.put("/admin/users/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { role, isActive } = req.body;
  const [user] = await db.update(usersTable)
    .set({ role, isActive })
    .where(eq(usersTable.id, raw))
    .returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeUser(user));
});

router.get("/admin/products", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = 20;
  let products = await db.select().from(productsTable);
  if (req.query.q) {
    const q = (req.query.q as string).toLowerCase();
    products = products.filter((p) => p.title.toLowerCase().includes(q));
  }
  if (req.query.status === "active") products = products.filter((p) => p.isActive);
  if (req.query.status === "inactive") products = products.filter((p) => !p.isActive);
  const total = products.length;
  const sliced = products.slice((page - 1) * limit, page * limit);
  res.json({ products: sliced.map(serializeProduct), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/admin/products", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const {
    title, description, richDescription, basePrice, sellingPrice, categoryId,
    stock, thumbnail, images, tags, sku, weight, specifications,
    isFeatured, isFlashSale, flashSalePrice, flashSaleEnd,
  } = req.body;
  if (!title || !basePrice || !sellingPrice || !categoryId) {
    res.status(400).json({ error: "title, basePrice, sellingPrice, categoryId are required" });
    return;
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
  const bp = String(Number(basePrice));
  const sp = String(Number(sellingPrice));
  const disc = Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100);
  const [product] = await db.insert(productsTable).values({
    title, slug,
    description: description || "",
    richDescription: richDescription || "",
    sku: sku || null,
    weight: weight ? String(Number(weight)) : null,
    specifications: specifications || {},
    basePrice: bp, sellingPrice: sp,
    discount: Math.max(0, disc),
    categoryId: Number(categoryId),
    stock: Number(stock) || 0,
    thumbnail: thumbnail || "",
    images: images || [],
    tags: tags || [],
    isActive: true,
    isFeatured: isFeatured ?? false,
    isFlashSale: isFlashSale ?? false,
    flashSalePrice: flashSalePrice ? String(Number(flashSalePrice)) : null,
    flashSaleEnd: flashSaleEnd ? new Date(flashSaleEnd) : null,
  }).returning();
  res.status(201).json(serializeProduct(product));
});

router.put("/admin/products/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const {
    isActive, isFeatured, isFlashSale, title, description, richDescription,
    basePrice, sellingPrice, categoryId, stock, thumbnail, images, tags,
    sku, weight, specifications, flashSalePrice, flashSaleEnd,
  } = req.body;
  const updateData: any = {};
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (isFlashSale !== undefined) updateData.isFlashSale = isFlashSale;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (richDescription !== undefined) updateData.richDescription = richDescription;
  if (sku !== undefined) updateData.sku = sku || null;
  if (weight !== undefined) updateData.weight = weight ? String(Number(weight)) : null;
  if (specifications !== undefined) updateData.specifications = specifications;
  if (basePrice !== undefined) updateData.basePrice = String(Number(basePrice));
  if (sellingPrice !== undefined) updateData.sellingPrice = String(Number(sellingPrice));
  if (categoryId !== undefined) updateData.categoryId = Number(categoryId);
  if (stock !== undefined) updateData.stock = Number(stock);
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
  if (images !== undefined) updateData.images = images;
  if (tags !== undefined) updateData.tags = tags;
  if (flashSalePrice !== undefined) updateData.flashSalePrice = flashSalePrice ? String(Number(flashSalePrice)) : null;
  if (flashSaleEnd !== undefined) updateData.flashSaleEnd = flashSaleEnd ? new Date(flashSaleEnd) : null;
  if (basePrice !== undefined && sellingPrice !== undefined) {
    updateData.discount = Math.max(0, Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100));
  }
  const [product] = await db.update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, id))
    .returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeProduct(product));
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  await db.delete(productsTable).where(eq(productsTable.id, parseInt(String(req.params.id), 10)));
  res.json({ success: true });
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = 20;
  let orders = await db.select().from(ordersTable);
  if (req.query.status) orders = orders.filter((o) => o.orderStatus === req.query.status);
  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = orders.length;
  const sliced = orders.slice((page - 1) * limit, page * limit);
  const enriched = await Promise.all(sliced.map(async (o) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
    return {
      id: o.id, orderNumber: o.orderNumber, userId: 0,
      items: items.map((i) => ({ id: i.id, orderId: i.orderId, productId: i.productId, variantId: null, sellerId: null, title: i.title, image: i.image, price: Number(i.price), quantity: i.quantity, itemStatus: i.itemStatus })),
      subtotal: Number(o.subtotal), discount: 0, shippingCost: 0, tax: 0, total: Number(o.total),
      couponCode: null, couponDiscount: 0, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus, trackingNumber: null, estimatedDelivery: null, rewardCoinsEarned: 0,
      rewardCoinsUsed: 0, shippingAddress: o.shippingAddressSnapshot, notes: null,
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    };
  }));
  res.json({ orders: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.put("/admin/orders/:id/status", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(String(req.params.id), 10);
  const { orderStatus } = req.body;
  const [order] = await db.update(ordersTable).set({ orderStatus }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: order.id, orderStatus: order.orderStatus });
});

router.get("/admin/orders/export", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const orders = await db.select().from(ordersTable);
  const rows = orders.map(o => [
    o.orderNumber, o.orderStatus, o.paymentStatus, o.paymentMethod,
    Number(o.total).toFixed(2), o.createdAt.toISOString()
  ]);
  const csv = ["Order #,Status,Payment Status,Payment Method,Total,Created At",
    ...rows.map(r => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  res.send(csv);
});

router.get("/admin/sellers", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = 20;
  let sellers = await db.select().from(sellersTable);
  if (req.query.status) sellers = sellers.filter((s) => s.status === req.query.status);
  const total = sellers.length;
  const sliced = sellers.slice((page - 1) * limit, page * limit);
  const enriched = await Promise.all(sliced.map(async (s) => {
    const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, s.id));
    return { id: s.id, storeName: s.storeName, storeSlug: s.storeSlug, storeLogo: s.storeLogo, storeBanner: s.storeBanner, description: s.description, isVerified: s.isVerified, status: s.status, rating: Number(s.rating), totalSales: s.totalSales, totalProducts: products.length, products: [] };
  }));
  res.json({ sellers: enriched, total, page, totalPages: Math.ceil(total / limit) });
});

router.put("/admin/sellers/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { isVerified, isActive, commissionRate, status } = req.body;
  const finalStatus = status ?? (isVerified === true ? "APPROVED" : isVerified === false ? "REJECTED" : undefined);
  const [seller] = await db.update(sellersTable)
    .set({ isVerified, isActive, commissionRate: commissionRate ? String(commissionRate) : undefined, status: finalStatus as any })
    .where(eq(sellersTable.id, id))
    .returning();
  if (!seller) { res.status(404).json({ error: "Not found" }); return; }
  if (isVerified && seller.userId) {
    await db.update(usersTable).set({ role: "SELLER" }).where(eq(usersTable.id, seller.userId));
  }
  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, seller.id));
  res.json({ id: seller.id, storeName: seller.storeName, storeSlug: seller.storeSlug, storeLogo: seller.storeLogo, storeBanner: seller.storeBanner, description: seller.description, isVerified: seller.isVerified, status: seller.status, rating: Number(seller.rating), totalSales: seller.totalSales, totalProducts: products.length, products: [] });
});

router.get("/admin/reviews", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const page = parseInt(req.query.page as string || "1", 10);
  let reviews = await db.select().from(reviewsTable);
  if (req.query.status === "approved") reviews = reviews.filter((r) => r.isApproved);
  if (req.query.status === "pending") reviews = reviews.filter((r) => !r.isApproved);
  const total = reviews.length;
  const sliced = reviews.slice((page - 1) * 20, page * 20);
  const enriched = sliced.map((r) => ({ id: r.id, userId: 0, userName: "User", userAvatar: null, productId: r.productId, rating: r.rating, title: r.title, body: r.body, images: r.images, isVerifiedPurchase: r.isVerifiedPurchase, helpfulCount: r.helpfulCount, isApproved: r.isApproved, createdAt: r.createdAt.toISOString() }));
  res.json({ reviews: enriched, total, page });
});

router.put("/admin/reviews/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(req.params.id, 10);
  const { isApproved } = req.body;
  const [review] = await db.update(reviewsTable).set({ isApproved }).where(eq(reviewsTable.id, id)).returning();
  if (!review) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: review.id, isApproved: review.isApproved });
});

router.delete("/admin/reviews/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(req.params.id, 10);
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  res.json({ success: true });
});

router.get("/admin/coupons", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const coupons = await db.select().from(couponsTable);
  res.json(coupons.map((c) => ({ ...c, value: Number(c.value), minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null, maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null, validFrom: c.validFrom.toISOString(), validTo: c.validTo.toISOString() })));
});

router.post("/admin/coupons", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const { code, description, type, value, minOrderAmount, maxDiscount, usageLimit, validFrom, validTo, isActive } = req.body;
  const [coupon] = await db.insert(couponsTable).values({
    code: code.toUpperCase(), description, type, value: String(value),
    minOrderAmount: minOrderAmount ? String(minOrderAmount) : undefined,
    maxDiscount: maxDiscount ? String(maxDiscount) : undefined,
    usageLimit, validFrom: new Date(validFrom), validTo: new Date(validTo), isActive,
  }).returning();
  res.status(201).json({ ...coupon, value: Number(coupon.value), minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null, maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null, validFrom: coupon.validFrom.toISOString(), validTo: coupon.validTo.toISOString() });
});

router.delete("/admin/coupons/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  await db.delete(couponsTable).where(eq(couponsTable.id, parseInt(req.params.id, 10)));
  res.json({ success: true });
});

const DEFAULT_SETTINGS = {
  siteName: "Kartigo", coinEarnRate: 2, coinRedeemRate: 0.1,
  shippingFreeThreshold: 499, shippingBaseCost: 49, taxRate: 0, codFee: 0,
  defaultCommissionRate: 10, maintenanceMode: false,
};

router.get("/admin/settings", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const rows = await db.select().from(platformSettingsTable);
  const settings: any = { ...DEFAULT_SETTINGS };
  rows.forEach((r) => {
    const val = r.value;
    if (val === "true") settings[r.key] = true;
    else if (val === "false") settings[r.key] = false;
    else if (!isNaN(Number(val))) settings[r.key] = Number(val);
    else settings[r.key] = val;
  });
  res.json(settings);
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const body = req.body;
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, key));
    if (existing.length > 0) {
      await db.update(platformSettingsTable).set({ value: String(value) }).where(eq(platformSettingsTable.key, key));
    } else {
      await db.insert(platformSettingsTable).values({ key, value: String(value) });
    }
  }
  res.json(body);
});

router.get("/admin/banners", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const banners = await db.select().from(bannersTable).orderBy(bannersTable.position);
  res.json(banners);
});

router.post("/admin/banners", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const { title, imageUrl, cloudinaryPublicId, linkUrl, position, isActive, startsAt, endsAt } = req.body;
  const [banner] = await db.insert(bannersTable).values({
    title, imageUrl, cloudinaryPublicId, linkUrl, position: position ?? 0,
    isActive: isActive ?? true,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
  }).returning();
  res.status(201).json(banner);
});

router.put("/admin/banners/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(req.params.id, 10);
  const { title, imageUrl, cloudinaryPublicId, linkUrl, position, isActive, startsAt, endsAt } = req.body;
  const [banner] = await db.update(bannersTable).set({
    title, imageUrl, cloudinaryPublicId, linkUrl, position, isActive,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
  }).where(eq(bannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Not found" }); return; }
  res.json(banner);
});

router.delete("/admin/banners/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  await db.delete(bannersTable).where(eq(bannersTable.id, parseInt(req.params.id, 10)));
  res.json({ success: true });
});

// ── Categories ────────────────────────────────────────────────────────────────
router.get("/admin/categories", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const cats = await db.select().from(categoriesTable);
  res.json(cats);
});

router.post("/admin/categories", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const { name, slug, description, image, icon, parentId, isActive, sortOrder } = req.body;
  const [cat] = await db.insert(categoriesTable).values({
    name, slug: slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description, image, icon, parentId: parentId ?? null,
    isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(cat);
});

router.put("/admin/categories/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  const id = parseInt(req.params.id, 10);
  const { name, slug, description, image, icon, isActive, sortOrder } = req.body;
  const [cat] = await db.update(categoriesTable)
    .set({ name, slug, description, image, icon, isActive, sortOrder })
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }
  res.json(cat);
});

router.delete("/admin/categories/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req, res)) return;
  await db.delete(categoriesTable).where(eq(categoriesTable.id, parseInt(req.params.id, 10)));
  res.json({ success: true });
});

export default router;
