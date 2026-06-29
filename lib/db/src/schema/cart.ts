import { pgTable, serial, varchar, integer, numeric, timestamp, text } from "drizzle-orm/pg-core";

export const cartsTable = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  couponCode: text("coupon_code"),
  couponDiscount: numeric("coupon_discount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull().default(1),
  priceAtAdd: numeric("price_at_add", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Cart = typeof cartsTable.$inferSelect;
export type InsertCart = typeof cartsTable.$inferInsert;
export type CartItem = typeof cartItemsTable.$inferSelect;
export type InsertCartItem = typeof cartItemsTable.$inferInsert;
