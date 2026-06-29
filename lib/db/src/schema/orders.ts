import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  text,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: varchar("user_id").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  couponCode: varchar("coupon_code"),
  couponDiscount: numeric("coupon_discount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: varchar("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  razorpayOrderId: varchar("razorpay_order_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  orderStatus: orderStatusEnum("order_status").notNull().default("PLACED"),
  trackingNumber: varchar("tracking_number"),
  estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
  rewardCoinsEarned: integer("reward_coins_earned").notNull().default(0),
  rewardCoinsUsed: integer("reward_coins_used").notNull().default(0),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  sellerId: integer("seller_id"),
  title: varchar("title", { length: 500 }).notNull(),
  image: varchar("image").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  itemStatus: varchar("item_status").notNull().default("PLACED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addressesTable = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  pincode: varchar("pincode").notNull(),
  landmark: varchar("landmark"),
  isDefault: boolean("is_default").notNull().default(false),
  type: varchar("type").notNull().default("HOME"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
export type Address = typeof addressesTable.$inferSelect;
export type InsertAddress = typeof addressesTable.$inferInsert;
