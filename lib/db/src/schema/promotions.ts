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

export const couponTypeEnum = pgEnum("coupon_type", ["PERCENTAGE", "FIXED", "FREE_SHIPPING"]);
export const bannerPositionEnum = pgEnum("banner_position", ["HERO", "SIDEBAR", "CATEGORY", "POPUP"]);

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  type: couponTypeEnum("type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validTo: timestamp("valid_to", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashSalesTable = pgTable("flash_sales", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  bannerImage: varchar("banner_image"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashSaleProductsTable = pgTable("flash_sale_products", {
  id: serial("id").primaryKey(),
  flashSaleId: integer("flash_sale_id").notNull(),
  productId: integer("product_id").notNull(),
});

export const promotionBannersTable = pgTable("banners_v2", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  image: varchar("image").notNull(),
  mobileImage: varchar("mobile_image"),
  link: varchar("link"),
  position: bannerPositionEnum("position").notNull().default("HERO"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Coupon = typeof couponsTable.$inferSelect;
export type InsertCoupon = typeof couponsTable.$inferInsert;
export type FlashSale = typeof flashSalesTable.$inferSelect;
export type InsertFlashSale = typeof flashSalesTable.$inferInsert;
export type PromotionBanner = typeof promotionBannersTable.$inferSelect;
export type InsertPromotionBanner = typeof promotionBannersTable.$inferInsert;
