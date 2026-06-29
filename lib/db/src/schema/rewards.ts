import { pgTable, serial, varchar, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const rewardTypeEnum = pgEnum("reward_type", ["EARNED", "REDEEMED", "EXPIRED"]);

export const rewardTransactionsTable = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: rewardTypeEnum("type").notNull(),
  coins: integer("coins").notNull(),
  description: text("description").notNull(),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RewardTransaction = typeof rewardTransactionsTable.$inferSelect;
export type InsertRewardTransaction = typeof rewardTransactionsTable.$inferInsert;
