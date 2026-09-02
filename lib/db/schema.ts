import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull();

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
});

export const painClusters = sqliteTable(
  "pain_clusters",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
  },
  (table) => [
    uniqueIndex("pain_clusters_category_slug_idx").on(table.categoryId, table.slug),
  ],
);

export const pains = sqliteTable(
  "pains",
  {
    id: text("id").primaryKey(),
    clusterId: text("cluster_id")
      .notNull()
      .references(() => painClusters.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    h1: text("h1").notNull(),
    problem: text("problem").notNull(),
    analysis: text("analysis").notNull(),
    whyNow: text("why_now"),
    strategy: text("strategy").notNull(),
    stage: integer("stage").$defaultFn(() => 3).notNull(),
    painScore: real("pain_score").notNull(),
    intentScore: real("intent_score").notNull(),
    competitionScore: real("competition_score").notNull(),
    productGap: real("product_gap").notNull(),
    affiliateScore: real("affiliate_score").notNull(),
    organicScore: real("organic_score").notNull(),
    opportunity: real("opportunity").notNull(),
    trend: real("trend").notNull(),
    sensitive: integer("sensitive", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    status: text("status").$defaultFn(() => "published").notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("pains_cluster_slug_idx").on(table.clusterId, table.slug)],
);

export const painSignals = sqliteTable(
  "pain_signals",
  {
    id: text("id").primaryKey(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    rawQuote: text("raw_quote").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceLabel: text("source_label").notNull(),
    sourceUrl: text("source_url"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("pain_signals_pain_idx").on(table.painId)],
);

export const criteria = sqliteTable(
  "criteria",
  {
    id: text("id").primaryKey(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    detail: text("detail").notNull(),
  },
  (table) => [index("criteria_pain_idx").on(table.painId)],
);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  whoFor: text("who_for").notNull(),
  searchQuery: text("search_query").notNull(),
  priceBand: text("price_band"),
});

export const productFits = sqliteTable(
  "product_fits",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    scores: text("scores").notNull(),
    note: text("note").notNull(),
  },
  (table) => [uniqueIndex("product_fits_unique_idx").on(table.productId, table.painId)],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    priorities: text("priorities").notNull(),
    email: text("email"),
    consentReport: integer("consent_report", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    consentMarketing: integer("consent_marketing", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    consentSensitive: integer("consent_sensitive", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("assessments_pain_idx").on(table.painId)],
);

export const watchlists = sqliteTable(
  "watchlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("watchlists_user_pain_idx").on(table.userId, table.painId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  watchlists: many(watchlists),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  clusters: many(painClusters),
}));

export const clusterRelations = relations(painClusters, ({ one, many }) => ({
  category: one(categories, {
    fields: [painClusters.categoryId],
    references: [categories.id],
  }),
  pains: many(pains),
}));

export const painRelations = relations(pains, ({ one, many }) => ({
  cluster: one(painClusters, {
    fields: [pains.clusterId],
    references: [painClusters.id],
  }),
  signals: many(painSignals),
  criteria: many(criteria),
  fits: many(productFits),
}));
