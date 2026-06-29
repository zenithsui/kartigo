import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function serializeReview(r: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
  return {
    id: r.id,
    userId: 0,
    userName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User",
    userAvatar: user?.profileImageUrl ?? null,
    productId: r.productId,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body,
    images: r.images,
    isVerifiedPurchase: r.isVerifiedPurchase,
    helpfulCount: r.helpfulCount,
    isApproved: r.isApproved,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reviews", async (req, res): Promise<void> => {
  const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;
  const page = parseInt(req.query.page as string || "1", 10);
  const ratingFilter = req.query.rating ? parseInt(req.query.rating as string, 10) : undefined;

  if (!productId) {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  let reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true)));

  if (ratingFilter) reviews = reviews.filter((r) => r.rating === ratingFilter);

  const total = reviews.length;
  const breakdown = { average: 0, total, five: 0, four: 0, three: 0, two: 0, one: 0 };
  reviews.forEach((r) => {
    if (r.rating === 5) breakdown.five++;
    else if (r.rating === 4) breakdown.four++;
    else if (r.rating === 3) breakdown.three++;
    else if (r.rating === 2) breakdown.two++;
    else if (r.rating === 1) breakdown.one++;
  });
  breakdown.average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  const sliced = reviews.slice((page - 1) * 10, page * 10);
  const serialized = await Promise.all(sliced.map(serializeReview));

  res.json({ reviews: serialized, breakdown, total, page });
});

router.post("/reviews", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { productId, orderId, rating, title, body, images } = req.body;

  let isVerifiedPurchase = false;
  if (orderId) {
    const [oi] = await db.select().from(orderItemsTable)
      .where(and(eq(orderItemsTable.orderId, orderId), eq(orderItemsTable.productId, productId)));
    isVerifiedPurchase = !!oi;
  }

  const [review] = await db.insert(reviewsTable).values({
    userId: req.user.id,
    productId,
    orderId,
    rating,
    title,
    body,
    images: images ?? [],
    isVerifiedPurchase,
  }).returning();

  // Update product rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, productId));
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await db.update(productsTable).set({
    averageRating: String(avg.toFixed(2)),
    totalReviews: allReviews.length,
  }).where(eq(productsTable.id, productId));

  res.status(201).json(await serializeReview(review));
});

router.post("/reviews/:id/helpful", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [review] = await db.update(reviewsTable)
    .set({ helpfulCount: eq(reviewsTable.id, id) as any })
    .where(eq(reviewsTable.id, id))
    .returning();
  // Simple increment workaround
  const [r] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(reviewsTable).set({ helpfulCount: r.helpfulCount + 1 }).where(eq(reviewsTable.id, id)).returning();
  res.json(await serializeReview(updated));
});

export default router;
