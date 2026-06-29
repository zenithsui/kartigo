import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

async function enrichCategories(cats: any[]): Promise<any[]> {
  return Promise.all(
    cats.map(async (c) => {
      const [{ count: cnt }] = await db
        .select({ count: count() })
        .from(productsTable)
        .where(eq(productsTable.categoryId, c.id));
      const children = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.parentId, c.id));
      return {
        ...c,
        productCount: Number(cnt),
        children: children.map((ch) => ({ ...ch, productCount: 0, children: [] })),
      };
    }),
  );
}

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.isActive, true));
  const rootCats = cats.filter((c) => !c.parentId);
  const enriched = await enrichCategories(rootCats);
  res.json(enriched);
});

router.post("/categories", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, slug, description, image, icon, parentId, isActive, sortOrder } = req.body;
  const [cat] = await db
    .insert(categoriesTable)
    .values({ name, slug, description, image, icon, parentId, isActive, sortOrder })
    .returning();
  res.status(201).json({ ...cat, productCount: 0, children: [] });
});

router.get("/categories/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [cat] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, raw));
  if (!cat) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [enriched] = await enrichCategories([cat]);
  res.json(enriched);
});

router.put("/categories/:slug", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const { name, description, image, icon, parentId, isActive, sortOrder } = req.body;
  const [cat] = await db
    .update(categoriesTable)
    .set({ name, description, image, icon, parentId, isActive, sortOrder })
    .where(eq(categoriesTable.slug, raw))
    .returning();
  if (!cat) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [enriched] = await enrichCategories([cat]);
  res.json(enriched);
});

router.delete("/categories/:slug", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  await db.delete(categoriesTable).where(eq(categoriesTable.slug, raw));
  res.sendStatus(204);
});

export default router;
