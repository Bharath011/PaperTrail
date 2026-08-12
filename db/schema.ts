import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const papers = sqliteTable("papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  authors: text("authors").notNull().default(""),
  year: text("year").notNull().default(""),
  section: text("section").notNull().default("General"),
  venue: text("venue").notNull().default(""),
  url: text("url").notNull().default(""),
  status: text("status").notNull().default("to-read"),
  remarks: text("remarks").notNull().default(""),
  keyTakeaways: text("key_takeaways").notNull().default(""),
  limitations: text("limitations").notNull().default(""),
  connections: text("connections").notNull().default(""),
  tags: text("tags").notNull().default(""),
  focusThisWeek: integer("focus_this_week").notNull().default(0),
  isRead: integer("is_read").notNull().default(0),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
