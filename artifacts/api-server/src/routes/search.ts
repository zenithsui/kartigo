import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, brandsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";

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

router.get("/search", async (req, res): Promise<void> => {
  const q = req.query.q as string;
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = parseInt(req.query.limit as string || "20", 10);
  const offset = (page - 1) * limit;

  let allProducts = await db.select().from(productsTable).where(eq(productsTable.isActive, true));

  if (q) {
    const lower = q.toLowerCase();
    allProducts = allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.tags.some((t) => t.toLowerCase().includes(lower)),
    );
  }

  const total = allProducts.length;
  const sliced = allProducts.slice(offset, offset + limit);

  res.json({
    products: sliced.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/search/suggestions", async (req, res): Promise<void> => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.json({ products: [], categories: [], brands: [] });
    return;
  }
  const lower = q.toLowerCase();
  const allProducts = await db.select().from(productsTable).where(eq(productsTable.isActive, true));
  const matchedProducts = allProducts
    .filter((p) => p.title.toLowerCase().includes(lower))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      thumbnail: p.thumbnail,
      sellingPrice: Number(p.sellingPrice),
    }));

  const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.isActive, true));
  const matchedCats = cats
    .filter((c) => c.name.toLowerCase().includes(lower))
    .slice(0, 3)
    .map((c) => ({ name: c.name, slug: c.slug }));

  const brands = await db.select().from(brandsTable).where(eq(brandsTable.isActive, true));
  const matchedBrands = brands
    .filter((b) => b.name.toLowerCase().includes(lower))
    .slice(0, 3)
    .map((b) => ({ name: b.name, slug: b.slug }));

  res.json({ products: matchedProducts, categories: matchedCats, brands: matchedBrands });
});

router.get("/search/trending", async (_req, res): Promise<void> => {
  res.json([
    "Samsung Galaxy",
    "Nike Sneakers",
    "Kurti",
    "Laptop",
    "Earphones",
    "Saree",
    "Watch",
    "Backpack",
  ]);
});

export default router;
