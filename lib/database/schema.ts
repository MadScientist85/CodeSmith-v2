// Database Schema Definitions using Drizzle ORM
import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, decimal, boolean, bigint } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table
export const usersEnhanced = pgTable("users_enhanced", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  tokenUsage: bigint("token_usage", { mode: "number" }).default(0),
  settings: jsonb("settings").default({}),
  oauthProvider: varchar("oauth_provider", { length: 50 }),
  oauthId: varchar("oauth_id", { length: 255 }),
  avatarUrl: text("avatar_url"),
  displayName: varchar("display_name", { length: 255 }),
})

// Chats table
export const chatsEnhanced = pgTable("chats_enhanced", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersEnhanced.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  visibility: varchar("visibility", { length: 20 }).default("private"),
  lastContext: jsonb("last_context").default({}),
  modelId: varchar("model_id", { length: 100 }),
  systemPrompt: text("system_prompt"),
  metadata: jsonb("metadata").default({}),
  totalTokens: integer("total_tokens").default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 6 }).default("0.00"),
  shareToken: uuid("share_token").unique().defaultRandom(),
})

// Messages table
export const messagesEnhanced = pgTable("messages_enhanced", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsEnhanced.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  parts: jsonb("parts").notNull().default([]),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  tokenCount: integer("token_count").default(0),
  modelUsed: varchar("model_used", { length: 100 }),
  reasoning: text("reasoning"),
  toolCalls: jsonb("tool_calls").default([]),
  toolResults: jsonb("tool_results").default([]),
  guardrailApplied: boolean("guardrail_applied").default(false),
  responseTimeMs: integer("response_time_ms"),
  cost: decimal("cost", { precision: 8, scale: 6 }).default("0.00"),
})

// Artifacts table
export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsEnhanced.id, { onDelete: "cascade" }),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messagesEnhanced.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 50 }),
  version: integer("version").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata").default({}),
  filePath: text("file_path"),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
})

// Model usage table
export const modelUsage = pgTable("model_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersEnhanced.id, { onDelete: "cascade" }),
  modelId: varchar("model_id", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cost: decimal("cost", { precision: 8, scale: 6 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  responseTimeMs: integer("response_time_ms"),
  errorCount: integer("error_count").default(0),
  success: boolean("success").default(true),
  chatId: uuid("chat_id").references(() => chatsEnhanced.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messagesEnhanced.id, { onDelete: "set null" }),
})

// Guardrail logs table
export const guardrailLogs = pgTable("guardrail_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersEnhanced.id, { onDelete: "cascade" }),
  chatId: uuid("chat_id").references(() => chatsEnhanced.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messagesEnhanced.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 20 }).notNull(),
  reason: text("reason").notNull(),
  originalContent: text("original_content"),
  modifiedContent: text("modified_content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  guardrailType: varchar("guardrail_type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).default("medium"),
})

// Integrations table
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersEnhanced.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  config: jsonb("config").notNull().default({}),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  apiKeyEncrypted: text("api_key_encrypted"),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
})

// Define relations
export const usersRelations = relations(usersEnhanced, ({ many }) => ({
  chats: many(chatsEnhanced),
  modelUsage: many(modelUsage),
  integrations: many(integrations),
}))

export const chatsRelations = relations(chatsEnhanced, ({ one, many }) => ({
  user: one(usersEnhanced, {
    fields: [chatsEnhanced.userId],
    references: [usersEnhanced.id],
  }),
  messages: many(messagesEnhanced),
  artifacts: many(artifacts),
}))

export const messagesRelations = relations(messagesEnhanced, ({ one, many }) => ({
  chat: one(chatsEnhanced, {
    fields: [messagesEnhanced.chatId],
    references: [chatsEnhanced.id],
  }),
  artifacts: many(artifacts),
}))

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  chat: one(chatsEnhanced, {
    fields: [artifacts.chatId],
    references: [chatsEnhanced.id],
  }),
  message: one(messagesEnhanced, {
    fields: [artifacts.messageId],
    references: [messagesEnhanced.id],
  }),
}))

// NextAuth compatible table exports
export const users = usersEnhanced
export const accounts = pgTable("accounts", {
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
})

export const sessions = pgTable("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable("verificationTokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
