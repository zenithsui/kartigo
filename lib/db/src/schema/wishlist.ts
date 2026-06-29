import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
export type InsertWishlistItem = typeof wishlistItemsTable.$inferInsert;
