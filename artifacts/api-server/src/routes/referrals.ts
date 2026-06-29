import { Router, type IRouter } from "express";
import { db, referralsTable, shareLinksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

router.get("/referrals", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  const refs = await db
    .select()
    .from(referralsTable)
    .where(eq(referralsTable.referrerId, req.user.id));
  res.json({
    referralCode: user?.referralCode ?? "",
    totalReferrals: refs.length,
    successfulReferrals: refs.filter((r) => r.status === "COMPLETED").length,
    totalEarned: refs.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.rewardAmount, 0),
    referrals: refs.map((r) => ({
      id: r.id,
      name: null,
      status: r.status,
      rewardAmount: r.rewardAmount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.post("/referrals/share", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { productId } = req.body;
  const uniqueCode = crypto.randomBytes(6).toString("hex");
  const [link] = await db
    .insert(shareLinksTable)
    .values({
      userId: req.user.id,
      productId,
      uniqueCode,
    })
    .returning();
  res.status(201).json({
    ...link,
    commissionEarned: Number(link.commissionEarned),
    url: `/products?ref=${uniqueCode}`,
    createdAt: link.createdAt.toISOString(),
  });
});

router.get("/referrals/reseller", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const links = await db
    .select()
    .from(shareLinksTable)
    .where(eq(shareLinksTable.userId, req.user.id));
  const totalEarnings = links.reduce((s, l) => s + Number(l.commissionEarned), 0);
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  res.json({
    totalEarnings,
    thisMonthEarnings: 0,
    totalClicks,
    totalConversions,
    shareLinks: links.map((l) => ({
      ...l,
      commissionEarned: Number(l.commissionEarned),
      url: `/products?ref=${l.uniqueCode}`,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export default router;
