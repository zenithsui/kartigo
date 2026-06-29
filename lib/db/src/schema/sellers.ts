import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const sellerStatusEnum = pgEnum("seller_status", ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);

export const sellersTable = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  storeName: varchar("store_name", { length: 300 }).notNull(),
  storeSlug: varchar("store_slug", { length: 300 }).notNull().unique(),
  storeLogo: varchar("store_logo"),
  storeBanner: varchar("store_banner"),
  description: text("description"),
  gstNumber: varchar("gst_number"),
  panNumber: varchar("pan_number"),
  status: sellerStatusEnum("status").notNull().default("PENDING"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalSales: integer("total_sales").notNull().default(0),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("10"),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  pendingPayout: numeric("pending_payout", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Seller = typeof sellersTable.$inferSelect;
export type InsertSeller = typeof sellersTable.$inferInsert;
