import { Router, type IRouter } from "express";
import { db, usersTable, rewardTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rewards/balance", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  const txns = await db
    .select()
    .from(rewardTransactionsTable)
    .where(eq(rewardTransactionsTable.userId, req.user.id));
  const lifetimeEarned = txns.filter((t) => t.type === "EARNED").reduce((s, t) => s + t.coins, 0);
  const lifetimeRedeemed = txns.filter((t) => t.type === "REDEEMED").reduce((s, t) => s + Math.abs(t.coins), 0);
  res.json({
    balance: user?.rewardCoins ?? 0,
    lifetimeEarned,
    lifetimeRedeemed,
  });
});

router.get("/rewards/history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const txns = await db
    .select()
    .from(rewardTransactionsTable)
    .where(eq(rewardTransactionsTable.userId, req.user.id));
  res.json(txns.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

export default router;
