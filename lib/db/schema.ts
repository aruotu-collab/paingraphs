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

export const industries = sqliteTable("industries", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at"),
});

export const niches = sqliteTable(
  "niches",
  {
    id: text("id").primaryKey(),
    industryId: text("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("niches_industry_slug_idx").on(table.industryId, table.slug),
  ],
);

export const countries = sqliteTable("countries", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  baseUrl: text("base_url"),
  enabled: integer("enabled", { mode: "boolean" }).$defaultFn(() => true).notNull(),
});

export const rawDocuments = sqliteTable(
  "raw_documents",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    author: text("author"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    ingestedAt: timestamp("ingested_at"),
  },
  (table) => [
    uniqueIndex("raw_documents_source_external_idx").on(
      table.sourceId,
      table.externalId,
    ),
  ],
);

export const problems = sqliteTable("problems", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const painSignals = sqliteTable(
  "pain_signals",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    documentId: text("document_id")
      .notNull()
      .references(() => rawDocuments.id, { onDelete: "cascade" }),
    quote: text("quote").notNull(),
    personaGuess: text("persona_guess"),
    workaround: text("workaround"),
    intensity: real("intensity"),
    purchaseIntent: real("purchase_intent"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("pain_signals_problem_idx").on(table.problemId),
    index("pain_signals_document_idx").on(table.documentId),
  ],
);

export const problemLinks = sqliteTable(
  "problem_links",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    industryId: text("industry_id").references(() => industries.id, {
      onDelete: "set null",
    }),
    nicheId: text("niche_id").references(() => niches.id, {
      onDelete: "set null",
    }),
    personaId: text("persona_id").references(() => personas.id, {
      onDelete: "set null",
    }),
    countryId: text("country_id").references(() => countries.id, {
      onDelete: "set null",
    }),
  },
  (table) => [index("problem_links_problem_idx").on(table.problemId)],
);

export const problemScores = sqliteTable(
  "problem_scores",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    scoredAt: timestamp("scored_at"),
    demand: real("demand").notNull(),
    pain: real("pain").notNull(),
    intent: real("intent").notNull(),
    competition: real("competition").notNull(),
    growth: real("growth").notNull(),
    buildability: real("buildability").notNull(),
    reachability: real("reachability"),
    solutionGap: real("solution_gap"),
    opportunity: real("opportunity").notNull(),
    confidence: real("confidence"),
    signalCount: integer("signal_count").$defaultFn(() => 0).notNull(),
    rationale: text("rationale"),
  },
  (table) => [index("problem_scores_problem_idx").on(table.problemId)],
);

export const workarounds = sqliteTable("workarounds", {
  id: text("id").primaryKey(),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
});

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  website: text("website"),
  countryCode: text("country_code"),
  createdAt: timestamp("created_at"),
});

export const solutions = sqliteTable("solutions", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").references(() => providers.id, {
    onDelete: "set null",
  }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary"),
  pricing: text("pricing"),
  createdAt: timestamp("created_at"),
});

export const solutionProblems = sqliteTable(
  "solution_problems",
  {
    id: text("id").primaryKey(),
    solutionId: text("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("solution_problems_unique_idx").on(
      table.solutionId,
      table.problemId,
    ),
  ],
);

export const productProfiles = sqliteTable(
  "product_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    name: text("name"),
    problemDna: text("problem_dna"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("product_profiles_user_idx").on(table.userId)],
);

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => productProfiles.id, { onDelete: "cascade" }),
    signalId: text("signal_id").references(() => painSignals.id, {
      onDelete: "set null",
    }),
    problemId: text("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    fit: real("fit").notNull(),
    intent: real("intent").notNull(),
    recency: real("recency"),
    why: text("why"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("matches_product_idx").on(table.productId)],
);

export const recommendedActions = sqliteTable("recommended_actions", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  draft: text("draft"),
  risk: text("risk"),
  status: text("status").$defaultFn(() => "pending").notNull(),
  createdAt: timestamp("created_at"),
});

export const savedMarkets = sqliteTable(
  "saved_markets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("saved_markets_user_idx").on(table.userId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  savedMarkets: many(savedMarkets),
  productProfiles: many(productProfiles),
}));

export const problemRelations = relations(problems, ({ many }) => ({
  signals: many(painSignals),
  scores: many(problemScores),
  links: many(problemLinks),
  workarounds: many(workarounds),
}));

export const savedMarketRelations = relations(savedMarkets, ({ one }) => ({
  user: one(user, {
    fields: [savedMarkets.userId],
    references: [user.id],
  }),
}));
