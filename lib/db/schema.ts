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

export const productScans = sqliteTable(
  "product_scans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    name: text("name").notNull(),
    dna: text("dna").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("product_scans_user_idx").on(table.userId)],
);

export const painHypotheses = sqliteTable(
  "pain_hypotheses",
  {
    id: text("id").primaryKey(),
    scanId: text("scan_id").references(() => productScans.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    catalogPainId: text("catalog_pain_id").references(() => pains.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    h1: text("h1").notNull(),
    problem: text("problem").notNull(),
    audience: text("audience").notNull(),
    analysis: text("analysis").notNull(),
    unmetNeed: text("unmet_need").notNull(),
    questions: text("questions").notNull(),
    campaignPack: text("campaign_pack").notNull(),
    status: text("status").$defaultFn(() => "hypothesis").notNull(),
    origin: text("origin").$defaultFn(() => "inside-out").notNull(),
    matchScore: integer("match_score").$defaultFn(() => 0).notNull(),
    isPublic: integer("is_public", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("pain_hypotheses_user_idx").on(table.userId),
    index("pain_hypotheses_status_idx").on(table.status),
  ],
);

export const hypothesisMetrics = sqliteTable(
  "hypothesis_metrics",
  {
    id: text("id").primaryKey(),
    hypothesisId: text("hypothesis_id")
      .notNull()
      .references(() => painHypotheses.id, { onDelete: "cascade" }),
    impressions: integer("impressions").$defaultFn(() => 0).notNull(),
    clicks: integer("clicks").$defaultFn(() => 0).notNull(),
    visitors: integer("visitors").$defaultFn(() => 0).notNull(),
    quizStarts: integer("quiz_starts").$defaultFn(() => 0).notNull(),
    quizCompleted: integer("quiz_completed").$defaultFn(() => 0).notNull(),
    optIns: integer("opt_ins").$defaultFn(() => 0).notNull(),
    hasProblem: integer("has_problem").$defaultFn(() => 0).notNull(),
    considerBuy: integer("consider_buy").$defaultFn(() => 0).notNull(),
    waitlist: integer("waitlist").$defaultFn(() => 0).notNull(),
    purchases: integer("purchases").$defaultFn(() => 0).notNull(),
    spendPence: integer("spend_pence").$defaultFn(() => 0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("hypothesis_metrics_hyp_idx").on(table.hypothesisId)],
);

export const hypothesisAnswers = sqliteTable(
  "hypothesis_answers",
  {
    id: text("id").primaryKey(),
    hypothesisId: text("hypothesis_id")
      .notNull()
      .references(() => painHypotheses.id, { onDelete: "cascade" }),
    answers: text("answers").notNull(),
    hasProblem: integer("has_problem", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    email: text("email"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("hypothesis_answers_hyp_idx").on(table.hypothesisId)],
);

export const affiliateOffers = sqliteTable(
  "affiliate_offers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    network: text("network").$defaultFn(() => "clickbank").notNull(),
    name: text("name").notNull(),
    salesUrl: text("sales_url").notNull(),
    vendor: text("vendor"),
    category: text("category"),
    description: text("description").notNull(),
    price: text("price"),
    commissionType: text("commission_type"),
    commissionAmount: text("commission_amount"),
    recurring: integer("recurring", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    hopLink: text("hop_link").notNull(),
    gravity: real("gravity"),
    avgPayout: text("avg_payout"),
    dna: text("dna"),
    assets: text("assets"),
    countries: text("countries"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("affiliate_offers_user_idx").on(table.userId)],
);

export const offerPainMatches = sqliteTable(
  "offer_pain_matches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    offerId: text("offer_id")
      .notNull()
      .references(() => affiliateOffers.id, { onDelete: "cascade" }),
    painId: text("pain_id").references(() => pains.id, { onDelete: "set null" }),
    hypothesisId: text("hypothesis_id").references(() => painHypotheses.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    problem: text("problem").notNull(),
    painScore: integer("pain_score").$defaultFn(() => 0).notNull(),
    moneyScore: integer("money_score").$defaultFn(() => 0).notNull(),
    productFit: integer("product_fit").$defaultFn(() => 0).notNull(),
    underservedScore: integer("underserved_score").$defaultFn(() => 0).notNull(),
    performanceScore: integer("performance_score").$defaultFn(() => 0).notNull(),
    recommendable: integer("recommendable", { mode: "boolean" })
      .$defaultFn(() => true)
      .notNull(),
    status: text("status").$defaultFn(() => "new").notNull(),
    evidenceNote: text("evidence_note"),
    intentScore: integer("intent_score").$defaultFn(() => 0).notNull(),
    draftSlug: text("draft_slug"),
    packJson: text("pack_json"),
    visitors: integer("visitors").$defaultFn(() => 0).notNull(),
    quizCompleted: integer("quiz_completed").$defaultFn(() => 0).notNull(),
    affiliateClicks: integer("affiliate_clicks").$defaultFn(() => 0).notNull(),
    sales: integer("sales").$defaultFn(() => 0).notNull(),
    commissionPence: integer("commission_pence").$defaultFn(() => 0).notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("offer_pain_matches_user_idx").on(table.userId),
    index("offer_pain_matches_status_idx").on(table.status),
  ],
);

export const programmeLeads = sqliteTable(
  "programme_leads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    painId: text("pain_id").references(() => pains.id, { onDelete: "set null" }),
    painTitle: text("pain_title").notNull(),
    name: text("name").notNull(),
    network: text("network").notNull(),
    commission: text("commission").notNull(),
    cookie: text("cookie").notNull(),
    price: text("price").notNull(),
    fit: integer("fit").$defaultFn(() => 0).notNull(),
    evidence: text("evidence").notNull(),
    sources: text("sources").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("programme_leads_user_idx").on(table.userId)],
);

export const pageVisits = sqliteTable(
  "page_visits",
  {
    id: text("id").primaryKey(),
    path: text("path").notNull(),
    query: text("query"),
    ip: text("ip").notNull(),
    country: text("country"),
    city: text("city"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    source: text("source"),
    sourceHost: text("source_host"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email"),
    isBot: integer("is_bot", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("page_visits_created_idx").on(table.createdAt),
    index("page_visits_ip_idx").on(table.ip),
    index("page_visits_path_idx").on(table.path),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  watchlists: many(watchlists),
  productScans: many(productScans),
  painHypotheses: many(painHypotheses),
  affiliateOffers: many(affiliateOffers),
  offerPainMatches: many(offerPainMatches),
  programmeLeads: many(programmeLeads),
  pageVisits: many(pageVisits),
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
