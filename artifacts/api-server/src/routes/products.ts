import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, brandsTable, sellersTable, productVariantsTable, reviewsTable } from "@workspace/db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

const router: IRouter = Router();

function serializeProduct(p: any, extras?: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    basePrice: Number(p.basePrice),
    sellingPrice: Number(p.sellingPrice),
    discount: p.discount,
    images: p.images,
    thumbnail: p.thumbnail,
    categoryId: p.categoryId,
    categoryName: extras?.categoryName ?? null,
    brandId: p.brandId ?? null,
    brandName: extras?.brandName ?? null,
    sellerId: p.sellerId ?? null,
    sellerName: extras?.sellerName ?? null,
    stock: p.stock,
    averageRating: Number(p.averageRating),
    totalReviews: p.totalReviews,
    totalSold: p.totalSold,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isFlashSale: p.isFlashSale,
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    tags: p.tags,
    createdAt: p.createdAt.toISOString(),
  };
}

async function enrichProduct(p: any) {
  let categoryName: string | null = null;
  let brandName: string | null = null;
  let sellerName: string | null = null;
  if (p.categoryId) {
    const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
    categoryName = cat?.name ?? null;
  }
  if (p.brandId) {
    const [brand] = await db.select({ name: brandsTable.name }).from(brandsTable).where(eq(brandsTable.id, p.brandId));
    brandName = brand?.name ?? null;
  }
  if (p.sellerId) {
    const [seller] = await db.select({ storeName: sellersTable.storeName }).from(sellersTable).where(eq(sellersTable.id, p.sellerId));
    sellerName = seller?.storeName ?? null;
  }
  return serializeProduct(p, { categoryName, brandName, sellerName });
}

router.get("/products", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1", 10);
  const limit = parseInt(req.query.limit as string || "20", 10);
  const offset = (page - 1) * limit;
  const q = req.query.q as string;
  const category = req.query.category as string;
  const brand = req.query.brand as string;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const featured = req.query.featured === "true";
  const flashSale = req.query.flashSale === "true";
  const sort = req.query.sort as string;

  let products = await db.select().from(productsTable).where(eq(productsTable.isActive, true));

  if (q) {
    const lower = q.toLowerCase();
    products = products.filter((p) => p.title.toLowerCase().includes(lower) || p.tags.some((t) => t.toLowerCase().includes(lower)));
  }
  if (category) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category));
    if (cat) products = products.filter((p) => p.categoryId === cat.id);
  }
  if (brand) {
    const [b] = await db.select().from(brandsTable).where(eq(brandsTable.slug, brand));
    if (b) products = products.filter((p) => p.brandId === b.id);
  }
  if (minPrice !== undefined) products = products.filter((p) => Number(p.sellingPrice) >= minPrice);
  if (maxPrice !== undefined) products = products.filter((p) => Number(p.sellingPrice) <= maxPrice);
  if (featured) products = products.filter((p) => p.isFeatured);
  if (flashSale) products = products.filter((p) => p.isFlashSale);

  if (sort === "price_asc") products.sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
  else if (sort === "price_desc") products.sort((a, b) => Number(b.sellingPrice) - Number(a.sellingPrice));
  else if (sort === "rating") products.sort((a, b) => Number(b.averageRating) - Number(a.averageRating));
  else if (sort === "newest") products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  else if (sort === "popular") products.sort((a, b) => b.totalSold - a.totalSold);

  const total = products.length;
  const sliced = products.slice(offset, offset + limit);

  res.json({
    products: sliced.map((p) => serializeProduct(p)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/products", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user.role !== "SELLER" && req.user.role !== "ADMIN")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { title, description, basePrice, sellingPrice, images, thumbnail, categoryId, brandId, stock, sku, weight, tags, specifications, isActive, isFeatured, richDescription } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  const discount = Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100);

  let sellerId: number | undefined;
  if (req.user.role === "SELLER") {
    const [seller] = await db.select().from(sellersTable).where(eq(sellersTable.userId, req.user.id));
    sellerId = seller?.id;
  }

  const [product] = await db.insert(productsTable).values({
    title,
    slug,
    description,
    richDescription,
    basePrice: String(basePrice),
    sellingPrice: String(sellingPrice),
    discount,
    images: images ?? [],
    thumbnail: thumbnail ?? (images?.[0] ?? ""),
    categoryId,
    brandId,
    sellerId,
    stock: stock ?? 0,
    sku,
    weight: weight ? String(weight) : undefined,
    tags: tags ?? [],
    specifications,
    isActive: isActive ?? true,
    isFeatured: isFeatured ?? false,
  }).returning();

  res.status(201).json(await enrichProduct(product));
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable)
    .where(and(eq(productsTable.isActive, true), eq(productsTable.isFeatured, true)))
    .limit(12);
  res.json(products.map((p) => serializeProduct(p)));
});

router.get("/products/flash-sale", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable)
    .where(and(eq(productsTable.isActive, true), eq(productsTable.isFlashSale, true)))
    .limit(12);
  res.json(products.map((p) => serializeProduct(p)));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable)
    .where(eq(productsTable.isActive, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(12);
  res.json(products.map((p) => serializeProduct(p)));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  // Skip special endpoints that are handled above
  if (["featured", "flash-sale", "new-arrivals"].includes(raw)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, raw));
  if (!product) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id));
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, product.id));

  const breakdown = { average: Number(product.averageRating), total: reviews.length, five: 0, four: 0, three: 0, two: 0, one: 0 };
  reviews.forEach((r) => {
    if (r.rating === 5) breakdown.five++;
    else if (r.rating === 4) breakdown.four++;
    else if (r.rating === 3) breakdown.three++;
    else if (r.rating === 2) breakdown.two++;
    else if (r.rating === 1) breakdown.one++;
  });

  const enriched = await enrichProduct(product);
  res.json({
    ...enriched,
    richDescription: product.richDescription,
    specifications: product.specifications,
    sku: product.sku,
    weight: product.weight ? Number(product.weight) : null,
    variants: variants.map((v) => ({
      ...v,
      price: Number(v.price),
    })),
    reviewBreakdown: breakdown,
  });
});

router.put("/products/:slug", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user.role !== "SELLER" && req.user.role !== "ADMIN")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const { title, description, basePrice, sellingPrice, images, thumbnail, categoryId, brandId, stock, sku, tags, isActive, isFeatured } = req.body;
  const discount = basePrice && sellingPrice ? Math.round(((Number(basePrice) - Number(sellingPrice)) / Number(basePrice)) * 100) : undefined;
  const [product] = await db.update(productsTable)
    .set({
      title, description,
      basePrice: basePrice ? String(basePrice) : undefined,
      sellingPrice: sellingPrice ? String(sellingPrice) : undefined,
      discount,
      images, thumbnail, categoryId, brandId, stock, sku, tags, isActive, isFeatured,
    })
    .where(eq(productsTable.slug, raw))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeProduct(product));
});

router.delete("/products/:slug", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user.role !== "SELLER" && req.user.role !== "ADMIN")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  await db.delete(productsTable).where(eq(productsTable.slug, raw));
  res.sendStatus(204);
});

router.get("/products/:slug/similar", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, raw));
  if (!product) {
    res.json([]);
    return;
  }
  const similar = await db.select().from(productsTable)
    .where(and(eq(productsTable.categoryId, product.categoryId), eq(productsTable.isActive, true)))
    .limit(8);
  res.json(similar.filter((p) => p.id !== product.id).map((p) => serializeProduct(p)));
});

export default router;
