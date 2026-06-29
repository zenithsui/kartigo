import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable, addressesTable, usersTable, rewardTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function serializeOrder(order: any, items: any[], address: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: 0,
    items: items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      productId: i.productId,
      variantId: i.variantId ?? null,
      sellerId: i.sellerId ?? null,
      title: i.title,
      image: i.image,
      price: Number(i.price),
      quantity: i.quantity,
      itemStatus: i.itemStatus,
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    couponCode: order.couponCode ?? null,
    couponDiscount: Number(order.couponDiscount),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
    rewardCoinsEarned: order.rewardCoinsEarned,
    rewardCoinsUsed: order.rewardCoinsUsed,
    shippingAddress: address,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function getOrderWithDetails(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const address = order.shippingAddressSnapshot;
  return serializeOrder(order, items, address);
}

router.get("/orders", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = parseInt(req.query.limit as string || "10", 10);
  const status = req.query.status as string;

  let orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user.id));
  if (status) orders = orders.filter((o) => o.orderStatus === status);
  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = orders.length;
  const sliced = orders.slice((page - 1) * limit, page * limit);

  const enriched = await Promise.all(sliced.map(async (order) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return serializeOrder(order, items, order.shippingAddressSnapshot);
  }));

  res.json({ orders: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/orders", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { addressId, paymentMethod, useRewardCoins, notes, couponCode } = req.body;

  const [address] = await db.select().from(addressesTable)
    .where(and(eq(addressesTable.id, addressId), eq(addressesTable.userId, req.user.id)));
  if (!address) {
    res.status(400).json({ error: "Address not found" });
    return;
  }

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, req.user.id));
  if (!cart) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }
  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const products = await Promise.all(
    cartItems.map(async (item) => {
      const [p] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { item, product: p };
    }),
  );

  const subtotal = products.reduce((s, { item, product }) => s + Number(product?.sellingPrice ?? 0) * item.quantity, 0);
  const couponDiscount = Number(cart.couponDiscount);
  const shippingCost = subtotal > 499 ? 0 : 49;
  const tax = 0;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  let rewardCoinsUsed = 0;
  let rewardDiscount = 0;
  if (useRewardCoins && user?.rewardCoins) {
    rewardCoinsUsed = Math.min(user.rewardCoins, Math.floor(subtotal * 0.1));
    rewardDiscount = rewardCoinsUsed * 0.1;
  }

  const total = subtotal - couponDiscount - rewardDiscount + shippingCost + tax;
  const rewardCoinsEarned = Math.floor(total * 0.02);
  const orderNumber = "KTG" + Date.now() + crypto.randomBytes(3).toString("hex").toUpperCase();

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: req.user.id,
    subtotal: String(subtotal),
    discount: "0",
    shippingCost: String(shippingCost),
    tax: String(tax),
    total: String(total),
    couponCode: cart.couponCode ?? couponCode,
    couponDiscount: String(couponDiscount),
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
    orderStatus: "PLACED",
    rewardCoinsEarned,
    rewardCoinsUsed,
    estimatedDelivery,
    shippingAddressSnapshot: address as any,
    notes,
  }).returning();

  await db.insert(orderItemsTable).values(
    products.map(({ item, product }) => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId,
      sellerId: product?.sellerId,
      title: product?.title ?? "",
      image: product?.thumbnail ?? "",
      price: String(product?.sellingPrice ?? 0),
      quantity: item.quantity,
      itemStatus: "PLACED",
    })),
  );

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  await db.update(cartsTable).set({ couponCode: null, couponDiscount: "0" }).where(eq(cartsTable.id, cart.id));

  // Update reward coins
  if (rewardCoinsEarned > 0) {
    await db.update(usersTable).set({ rewardCoins: (user?.rewardCoins ?? 0) + rewardCoinsEarned - rewardCoinsUsed })
      .where(eq(usersTable.id, req.user.id));
    await db.insert(rewardTransactionsTable).values({
      userId: req.user.id,
      type: "EARNED",
      coins: rewardCoinsEarned,
      description: `Earned for order ${orderNumber}`,
      orderId: order.id,
    });
  }

  const result = await getOrderWithDetails(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, id), eq(ordersTable.userId, req.user.id)));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(await getOrderWithDetails(id));
});

router.post("/orders/:id/cancel", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.update(ordersTable).set({ orderStatus: "CANCELLED" })
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, req.user.id)));
  res.json(await getOrderWithDetails(id));
});

router.post("/orders/:id/return", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.update(ordersTable).set({ orderStatus: "RETURNED" })
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, req.user.id)));
  res.json(await getOrderWithDetails(id));
});

export default router;
