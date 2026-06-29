import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description").notNull().default(""),
  richDescription: text("rich_description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
  discount: integer("discount").notNull().default(0),
  images: text("images").array().notNull().default([]),
  thumbnail: varchar("thumbnail").notNull().default(""),
  categoryId: integer("category_id").notNull(),
  brandId: integer("brand_id"),
  sellerId: integer("seller_id"),
  stock: integer("stock").notNull().default(0),
  sku: varchar("sku"),
  weight: numeric("weight", { precision: 8, scale: 2 }),
  specifications: jsonb("specifications"),
  tags: text("tags").array().notNull().default([]),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalSold: integer("total_sold").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  isFlashSale: boolean("is_flash_sale").notNull().default(false),
  flashSalePrice: numeric("flash_sale_price", { precision: 10, scale: 2 }),
  flashSaleEnd: timestamp("flash_sale_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productVariantsTable = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  sku: varchar("sku"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  images: text("images").array().notNull().default([]),
  attributes: jsonb("attributes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = typeof productsTable.$inferInsert;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
export type InsertProductVariant = typeof productVariantsTable.$inferInsert;
