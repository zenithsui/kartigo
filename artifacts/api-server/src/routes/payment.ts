import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

router.post("/payment/create-order", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orderId, amount } = req.body;
  const razorpayOrderId = `order_${crypto.randomBytes(10).toString("hex")}`;
  await db
    .update(ordersTable)
    .set({ razorpayOrderId })
    .where(eq(ordersTable.id, orderId));
  res.json({
    razorpayOrderId,
    amount,
    currency: "INR",
    keyId: "rzp_test_mock_kartigo",
  });
});

router.post("/payment/verify", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const [order] = await db.update(ordersTable)
    .set({ paymentStatus: "PAID", razorpayPaymentId, orderStatus: "CONFIRMED" })
    .where(eq(ordersTable.id, orderId))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
});

export default router;
