import { Router, type IRouter } from "express";
import { db, couponsTable, flashSalesTable, flashSaleProductsTable, productsTable, bannersTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    sellingPrice: Number(p.sellingPrice),
    averageRating: Number(p.averageRating),
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    categoryName: null,
    brandName: null,
    sellerName: null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/promotions/flash-sales", async (_req, res): Promise<void> => {
  const now = new Date();
  const sales = await db
    .select()
    .from(flashSalesTable)
    .where(eq(flashSalesTable.isActive, true));

  const enriched = await Promise.all(
    sales.map(async (sale) => {
      const fsp = await db
        .select()
        .from(flashSaleProductsTable)
        .where(eq(flashSaleProductsTable.flashSaleId, sale.id));
      const productIds = fsp.map((f) => f.productId);
      const products = productIds.length
        ? await Promise.all(
            productIds.map((id) =>
              db.select().from(productsTable).where(eq(productsTable.id, id)).then(([p]) => p),
            ),
          ).then((ps) => ps.filter(Boolean))
        : [];
      return {
        ...sale,
        startTime: sale.startTime.toISOString(),
        endTime: sale.endTime.toISOString(),
        products: products.map(serializeProduct),
      };
    }),
  );
  res.json(enriched);
});

router.post("/promotions/flash-sales", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { title, bannerImage, startTime, endTime, productIds } = req.body;
  const [sale] = await db
    .insert(flashSalesTable)
    .values({ title, bannerImage, startTime: new Date(startTime), endTime: new Date(endTime) })
    .returning();
  if (productIds?.length) {
    await db.insert(flashSaleProductsTable).values(
      productIds.map((pid: number) => ({ flashSaleId: sale.id, productId: pid })),
    );
  }
  res.status(201).json({ ...sale, startTime: sale.startTime.toISOString(), endTime: sale.endTime.toISOString(), products: [] });
});

router.post("/promotions/coupons/validate", async (req, res): Promise<void> => {
  const { code, orderAmount } = req.body;
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, code.toUpperCase()));

  if (!coupon || !coupon.isActive) {
    res.status(400).json({ valid: false, code, message: "Invalid or expired coupon" });
    return;
  }
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    res.status(400).json({ valid: false, code, message: "Coupon has expired" });
    return;
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ valid: false, code, message: "Coupon usage limit reached" });
    return;
  }
  if (coupon.minOrderAmount && orderAmount && Number(orderAmount) < Number(coupon.minOrderAmount)) {
    res.status(400).json({ valid: false, code, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    return;
  }

  let discountAmount = 0;
  const value = Number(coupon.value);
  if (coupon.type === "PERCENTAGE") {
    discountAmount = ((orderAmount || 0) * value) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  } else if (coupon.type === "FIXED") {
    discountAmount = value;
  } else {
    discountAmount = 0;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.type,
    discountValue: value,
    discountAmount,
    message: `Coupon applied! You save ₹${discountAmount.toFixed(0)}`,
  });
});

router.get("/promotions/banners", async (req, res): Promise<void> => {
  const positionParam = req.query.position;
  let banners = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true));
  if (positionParam !== undefined) {
    const pos = parseInt(String(positionParam), 10);
    if (!isNaN(pos)) banners = banners.filter((b) => b.position === pos);
  }
  res.json(banners);
});

export default router;
