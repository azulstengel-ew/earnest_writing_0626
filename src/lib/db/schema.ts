import { pgTable, text, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull().default(""),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("novel"),
  theme: text("theme").notNull().default("books-stories"),
  premise: text("premise").notNull().default(""),
  target: integer("target").notNull().default(50000),
  weeklyWordTarget: integer("weekly_word_target").notNull().default(1000),
  archived: boolean("archived").notNull().default(false),
  framework: text("framework").notNull().default("three-act"),
  customActs: jsonb("custom_acts").notNull().default([]),
  customBeats: jsonb("custom_beats").notNull().default([]),
  tensionCurve: jsonb("tension_curve").notNull().default([]),
  chapters: jsonb("chapters").notNull().default([]),
  characters: jsonb("characters").notNull().default([]),
  connections: jsonb("connections").notNull().default([]),
  arcs: jsonb("arcs").notNull().default([]),
  events: jsonb("events").notNull().default([]),
  researchSnippets: jsonb("research_snippets").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DbProject = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
