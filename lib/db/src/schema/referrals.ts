import { pgTable, serial, varchar, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const referralStatusEnum = pgEnum("referral_status", ["PENDING", "COMPLETED", "EXPIRED"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull(),
  referredId: varchar("referred_id").notNull().unique(),
  status: referralStatusEnum("status").notNull().default("PENDING"),
  rewardAmount: integer("reward_amount").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shareLinksTable = pgTable("share_links", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").notNull(),
  uniqueCode: varchar("unique_code").notNull().unique(),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  commissionEarned: numeric("commission_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
export type InsertReferral = typeof referralsTable.$inferInsert;
export type ShareLink = typeof shareLinksTable.$inferSelect;
export type InsertShareLink = typeof shareLinksTable.$inferInsert;
