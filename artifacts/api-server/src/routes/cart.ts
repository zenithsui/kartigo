import { Router, type IRouter } from "express";
import { db, cartsTable, cartItemsTable, productsTable, couponsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateCart(userId: string) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, userId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ userId }).returning();
  }
  return cart;
}

function serializeProduct(p: any) {
  return {
    id: p.id, title: p.title, slug: p.slug, description: p.description,
    basePrice: Number(p.basePrice), sellingPrice: Number(p.sellingPrice), discount: p.discount,
    images: p.images, thumbnail: p.thumbnail, categoryId: p.categoryId, categoryName: null,
    brandId: p.brandId, brandName: null, sellerId: p.sellerId, sellerName: null,
    stock: p.stock, averageRating: Number(p.averageRating), totalReviews: p.totalReviews,
    totalSold: p.totalSold, isActive: p.isActive, isFeatured: p.isFeatured, isFlashSale: p.isFlashSale,
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    tags: p.tags, createdAt: p.createdAt.toISOString(),
  };
}

async function buildCartResponse(cart: any, userId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtAdd: Number(item.priceAtAdd),
        product: product ? serializeProduct(product) : null,
        variantName: null,
      };
    }),
  );

  const subtotal = enriched.reduce((s, i) => s + (i.product?.sellingPrice ?? 0) * i.quantity, 0);
  const discount = enriched.reduce((s, i) => {
    const base = i.product?.basePrice ?? 0;
    const sell = i.product?.sellingPrice ?? 0;
    return s + (base - sell) * i.quantity;
  }, 0);
  const couponDiscount = Number(cart.couponDiscount);
  const shippingCost = subtotal > 499 ? 0 : 49;
  const total = subtotal - couponDiscount + shippingCost;

  return {
    id: cart.id,
    items: enriched,
    subtotal,
    discount,
    couponCode: cart.couponCode,
    couponDiscount,
    shippingCost,
    total,
    itemCount: enriched.reduce((s, i) => s + i.quantity, 0),
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json({ id: 0, items: [], subtotal: 0, discount: 0, couponCode: null, couponDiscount: 0, shippingCost: 0, total: 0, itemCount: 0 });
    return;
  }
  const cart = await getOrCreateCart(req.user.id);
  res.json(await buildCartResponse(cart, req.user.id));
});

router.post("/cart/add", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { productId, variantId, quantity } = req.body;
  const cart = await getOrCreateCart(req.user.id);

  const [existing] = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, productId)));

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  const price = product?.sellingPrice ?? "0";

  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + (quantity ?? 1) }).where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      cartId: cart.id,
      productId,
      variantId,
      quantity: quantity ?? 1,
      priceAtAdd: price,
    });
  }

  res.json(await buildCartResponse(cart, req.user.id));
});

router.put("/cart/update", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { itemId, quantity } = req.body;
  const cart = await getOrCreateCart(req.user.id);
  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  } else {
    await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  }
  res.json(await buildCartResponse(cart, req.user.id));
});

router.delete("/cart/:itemId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(rawId, 10);
  const cart = await getOrCreateCart(req.user.id);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  res.json(await buildCartResponse(cart, req.user.id));
});

router.post("/cart/apply-coupon", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { code } = req.body;
  const cart = await getOrCreateCart(req.user.id);
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  const subtotal = items.reduce(async (accP, item) => {
    const acc = await accP;
    const [p] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    return acc + Number(p?.sellingPrice ?? 0) * item.quantity;
  }, Promise.resolve(0));
  const stotal = await subtotal;

  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));
  if (!coupon || !coupon.isActive || new Date() > coupon.validTo || new Date() < coupon.validFrom) {
    res.status(400).json({ error: "Invalid or expired coupon" });
    return;
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (stotal * Number(coupon.value)) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else if (coupon.type === "FIXED") {
    discount = Number(coupon.value);
  }

  await db.update(cartsTable).set({ couponCode: coupon.code, couponDiscount: String(discount) }).where(eq(cartsTable.id, cart.id));
  const updated = await getOrCreateCart(req.user.id);
  res.json(await buildCartResponse(updated, req.user.id));
});

router.delete("/cart/coupon", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const cart = await getOrCreateCart(req.user.id);
  await db.update(cartsTable).set({ couponCode: null, couponDiscount: "0" }).where(eq(cartsTable.id, cart.id));
  const updated = await getOrCreateCart(req.user.id);
  res.json(await buildCartResponse(updated, req.user.id));
});

export default router;
