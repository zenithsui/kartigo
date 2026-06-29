import { Router, type IRouter } from "express";
import { db, wishlistItemsTable, productsTable } from "@workspace/db";
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

router.get("/wishlist", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json([]);
    return;
  }
  const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, req.user.id));
  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return {
        id: item.id,
        productId: item.productId,
        product: product ? serializeProduct(product) : null,
        addedAt: item.createdAt.toISOString(),
      };
    }),
  );
  res.json(enriched);
});

router.post("/wishlist", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { productId } = req.body;
  const existing = await db.select().from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.userId, req.user.id), eq(wishlistItemsTable.productId, productId)));
  if (existing.length > 0) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    res.status(201).json({ id: existing[0].id, productId, product: product ? serializeProduct(product) : null, addedAt: existing[0].createdAt.toISOString() });
    return;
  }
  const [item] = await db.insert(wishlistItemsTable).values({ userId: req.user.id, productId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  res.status(201).json({ id: item.id, productId, product: product ? serializeProduct(product) : null, addedAt: item.createdAt.toISOString() });
});

router.delete("/wishlist/:productId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  await db.delete(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.userId, req.user.id), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

export default router;
