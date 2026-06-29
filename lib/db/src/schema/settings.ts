import { pgTable, serial, varchar, numeric, boolean, timestamp, text, jsonb, integer } from "drizzle-orm/pg-core";

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: varchar("value", { length: 500 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PlatformSetting = typeof platformSettingsTable.$inferSelect;
export type InsertPlatformSetting = typeof platformSettingsTable.$inferInsert;

export const bannersTable = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: varchar("image_url", { length: 1000 }).notNull(),
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Banner = typeof bannersTable.$inferSelect;
export type InsertBanner = typeof bannersTable.$inferInsert;

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  actorId: varchar("actor_id", { length: 100 }),
  actorEmail: varchar("actor_email", { length: 200 }),
  actorRole: varchar("actor_role", { length: 20 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 100 }),
  details: text("details"),
  ip: varchar("ip", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
