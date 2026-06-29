import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  addressesTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const seller = await db.query?.sellersTable?.findFirst?.({
    where: (s: any, { eq: eq2 }: any) => eq2(s.userId, req.user.id),
  });
  res.json({
    id: 0,
    replitId: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    email: user.email,
    phone: user.phone,
    avatar: user.profileImageUrl,
    role: user.role,
    rewardCoins: user.rewardCoins,
    referralCode: user.referralCode,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, phone, avatar } = req.body;
  const nameParts = (name || "").split(" ");
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;
  await db
    .update(usersTable)
    .set({
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      phone: phone ?? undefined,
      profileImageUrl: avatar ?? undefined,
    })
    .where(eq(usersTable.id, req.user.id));
  const [updated] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  res.json({
    id: 0,
    replitId: updated.id,
    name: [updated.firstName, updated.lastName].filter(Boolean).join(" ") || null,
    email: updated.email,
    phone: updated.phone,
    avatar: updated.profileImageUrl,
    role: updated.role,
    rewardCoins: updated.rewardCoins,
    referralCode: updated.referralCode,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/users/addresses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const addresses = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.userId, req.user.id));
  res.json(addresses);
});

router.post("/users/addresses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault, type } = req.body;
  if (isDefault) {
    await db
      .update(addressesTable)
      .set({ isDefault: false })
      .where(eq(addressesTable.userId, req.user.id));
  }
  const [addr] = await db
    .insert(addressesTable)
    .values({
      userId: req.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      isDefault: isDefault ?? false,
      type: type ?? "HOME",
    })
    .returning();
  res.status(201).json(addr);
});

router.put("/users/addresses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault, type } = req.body;
  if (isDefault) {
    await db
      .update(addressesTable)
      .set({ isDefault: false })
      .where(eq(addressesTable.userId, req.user.id));
  }
  const [addr] = await db
    .update(addressesTable)
    .set({ fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault, type })
    .where(and(eq(addressesTable.id, id), eq(addressesTable.userId, req.user.id)))
    .returning();
  if (!addr) {
    res.status(404).json({ error: "Address not found" });
    return;
  }
  res.json(addr);
});

router.delete("/users/addresses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db
    .delete(addressesTable)
    .where(and(eq(addressesTable.id, id), eq(addressesTable.userId, req.user.id)));
  res.sendStatus(204);
});

router.get("/users/notifications", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json([]);
    return;
  }
  const items = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user.id));
  res.json(items.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  })));
});

export default router;
