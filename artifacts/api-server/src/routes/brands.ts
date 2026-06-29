import { Router, type IRouter } from "express";
import { db, brandsTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/brands", async (req, res): Promise<void> => {
  const brands = await db.select().from(brandsTable).where(eq(brandsTable.isActive, true));
  const withCounts = await Promise.all(
    brands.map(async (b) => {
      const [{ count: cnt }] = await db
        .select({ count: count() })
        .from(productsTable)
        .where(eq(productsTable.brandId, b.id));
      return { ...b, productCount: Number(cnt) };
    }),
  );
  res.json(withCounts);
});

router.post("/brands", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, slug, logo, bannerImage, description, isActive, isFeatured } = req.body;
  const [brand] = await db
    .insert(brandsTable)
    .values({ name, slug, logo, bannerImage, description, isActive, isFeatured })
    .returning();
  res.status(201).json({ ...brand, productCount: 0 });
});

router.get("/brands/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.slug, raw));
  if (!brand) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.brandId, brand.id))
    .limit(20);
  res.json({ ...brand, productCount: products.length, products: products.map(serializeProduct) });
});

function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    sellingPrice: Number(p.sellingPrice),
    averageRating: Number(p.averageRating),
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
