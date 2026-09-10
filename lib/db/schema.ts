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

export const affiliateCodes = sqliteTable("affiliate_codes", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
});

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

export const pageEvents = sqliteTable(
  "page_events",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    path: text("path").notNull(),
    painId: text("pain_id"),
    ip: text("ip"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("page_events_kind_idx").on(table.kind),
    index("page_events_pain_idx").on(table.painId),
    index("page_events_path_idx").on(table.path),
  ],
);

export const billboardTopics = sqliteTable(
  "billboard_topics",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    problem: text("problem").notNull(),
    whyNow: text("why_now").notNull(),
    categorySlug: text("category_slug").notNull(),
    categoryName: text("category_name").notNull(),
    searchPhrase: text("search_phrase").notNull(),
    evidence: text("evidence").notNull(),
    sources: text("sources").notNull(),
    heat: integer("heat").notNull(),
    intent: integer("intent").notNull(),
    pain: integer("pain").notNull(),
    rank: integer("rank").notNull(),
    daysOnChart: integer("days_on_chart").notNull(),
    chartDate: text("chart_date").notNull(),
    painId: text("pain_id"),
    firstSeenAt: timestamp("first_seen_at"),
    lastSeenAt: timestamp("last_seen_at"),
  },
  (table) => [index("billboard_topics_rank_idx").on(table.rank)],
);

export const billboardFavourites = sqliteTable(
  "billboard_favourites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => billboardTopics.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("billboard_fav_user_topic_idx").on(table.userId, table.topicId),
  ],
);

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("role_permissions_unique_idx").on(
      table.roleId,
      table.permissionId,
    ),
  ],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("user_roles_unique_idx").on(table.userId, table.roleId),
    index("user_roles_user_idx").on(table.userId),
  ],
);

export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  consumerEnabled: integer("consumer_enabled", { mode: "boolean" })
    .$defaultFn(() => true)
    .notNull(),
  affiliateEnabled: integer("affiliate_enabled", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  founderEnabled: integer("founder_enabled", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  primaryMode: text("primary_mode").$defaultFn(() => "solve").notNull(),
  plan: text("plan").$defaultFn(() => "free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"),
  stripeCancelAt: integer("stripe_cancel_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorUserId),
    index("audit_logs_action_idx").on(table.action),
  ],
);

export const affiliateDestinations = sqliteTable(
  "affiliate_destinations",
  {
    id: text("id").primaryKey(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    country: text("country").notNull().default("*"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("affiliate_destinations_pain_product_country_idx").on(
      table.painId,
      table.productId,
      table.country,
    ),
  ],
);

export const affiliateProgrammes = sqliteTable(
  "affiliate_programmes",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    ownerStatus: text("owner_status"),
    country: text("country"),
    joinUrl: text("join_url"),
    note: text("note").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("affiliate_programmes_product_idx").on(table.productId)],
);

export const destinationClicks = sqliteTable(
  "destination_clicks",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => affiliateDestinations.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    country: text("country"),
    visitorCountry: text("visitor_country"),
    sourcePath: text("source_path"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("destination_clicks_pain_idx").on(table.painId),
    index("destination_clicks_destination_idx").on(table.destinationId),
  ],
);

export const memberDestinations = sqliteTable(
  "member_destinations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    country: text("country").notNull().default("*"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("member_destinations_user_pain_product_country_idx").on(
      table.userId,
      table.painId,
      table.productId,
      table.country,
    ),
    index("member_destinations_user_idx").on(table.userId),
  ],
);

export const dailyOpportunities = sqliteTable(
  "daily_opportunities",
  {
    day: text("day").notNull(),
    lens: text("lens").notNull(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("daily_opportunities_day_lens_idx").on(table.day, table.lens),
    index("daily_opportunities_lens_idx").on(table.lens),
  ],
);

export const alertPreferences = sqliteTable("alert_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  emailSavedUpdates: integer("email_saved_updates", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  emailOpportunity: integer("email_opportunity", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  emailPriceUpdates: integer("email_price_updates", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  emailSearchUpdates: integer("email_search_updates", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  updatedAt: timestamp("updated_at"),
});

export const painWatchSnapshots = sqliteTable("pain_watch_snapshots", {
  painId: text("pain_id")
    .primaryKey()
    .references(() => pains.id, { onDelete: "cascade" }),
  evidenceCount: integer("evidence_count").notNull(),
  destinationCount: integer("destination_count").notNull(),
  productCount: integer("product_count").notNull(),
  affiliateScore: real("affiliate_score").notNull(),
  founderScore: real("founder_score").notNull(),
  capturedAt: timestamp("captured_at"),
});

export const memberAlerts = sqliteTable(
  "member_alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    painId: text("pain_id").references(() => pains.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href").notNull(),
    day: text("day").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    emailedAt: integer("emailed_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("member_alerts_user_kind_pain_day_idx").on(
      table.userId,
      table.kind,
      table.painId,
      table.day,
    ),
    index("member_alerts_user_idx").on(table.userId),
  ],
);

export const painGraphScores = sqliteTable("pain_graph_scores", {
  painId: text("pain_id")
    .primaryKey()
    .references(() => pains.id, { onDelete: "cascade" }),
  demandScore: real("demand_score"),
  growthScore: real("growth_score"),
  buyingIntentScore: real("buying_intent_score"),
  recurrenceScore: real("recurrence_score"),
  dissatisfactionScore: real("dissatisfaction_score"),
  reachabilityScore: real("reachability_score"),
  founderScore: real("founder_score"),
  paidAcquisitionScore: real("paid_acquisition_score"),
  confidenceScore: real("confidence_score"),
  updatedAt: timestamp("updated_at"),
});

export const discoverySources = sqliteTable("discovery_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(),
  accessMethod: text("access_method").notNull(),
  commercialUse: text("commercial_use").notNull(),
  termsNotes: text("terms_notes"),
  attribution: text("attribution"),
  retention: text("retention"),
  rateLimit: text("rate_limit"),
  frequencyHours: integer("frequency_hours").$defaultFn(() => 24).notNull(),
  qualityScore: real("quality_score"),
  trustScore: real("trust_score"),
  enabled: integer("enabled", { mode: "boolean" })
    .$defaultFn(() => true)
    .notNull(),
  lastIngestedAt: integer("last_ingested_at", { mode: "timestamp_ms" }),
  feedUrl: text("feed_url"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const discoverySignals = sqliteTable(
  "discovery_signals",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => discoverySources.id, { onDelete: "cascade" }),
    rawText: text("raw_text").notNull(),
    sourceUrl: text("source_url"),
    persona: text("persona"),
    geography: text("geography"),
    status: text("status").$defaultFn(() => "new").notNull(),
    matchedPainId: text("matched_pain_id").references(() => pains.id, {
      onDelete: "set null",
    }),
    candidateId: text("candidate_id"),
    confidence: real("confidence"),
    fingerprint: text("fingerprint"),
    extractedJson: text("extracted_json"),
    extractedAt: integer("extracted_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("discovery_signals_status_idx").on(table.status),
    index("discovery_signals_source_idx").on(table.sourceId),
  ],
);

export const painCandidates = sqliteTable(
  "pain_candidates",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    problem: text("problem").notNull(),
    persona: text("persona"),
    categorySlug: text("category_slug"),
    clusterSlug: text("cluster_slug"),
    countries: text("countries"),
    productsDetected: text("products_detected"),
    evidenceCount: integer("evidence_count").$defaultFn(() => 0).notNull(),
    sourceTypes: text("source_types"),
    confidence: real("confidence"),
    buyingIntent: real("buying_intent"),
    severity: real("severity"),
    founderOpportunity: real("founder_opportunity"),
    affiliateOpportunity: real("affiliate_opportunity"),
    relatedPainId: text("related_pain_id").references(() => pains.id, {
      onDelete: "set null",
    }),
    status: text("status").$defaultFn(() => "new").notNull(),
    origin: text("origin").$defaultFn(() => "manual").notNull(),
    sourceId: text("source_id").references(() => discoverySources.id, {
      onDelete: "set null",
    }),
    painId: text("pain_id").references(() => pains.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    workaround: text("workaround"),
    triggerText: text("trigger_text"),
    jobToBeDone: text("job_to_be_done"),
    extractionJson: text("extraction_json"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("pain_candidates_status_idx").on(table.status),
    index("pain_candidates_origin_idx").on(table.origin),
  ],
);

export const painCandidateSignals = sqliteTable(
  "pain_candidate_signals",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => painCandidates.id, { onDelete: "cascade" }),
    rawQuote: text("raw_quote").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceLabel: text("source_label").notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("pain_candidate_signals_candidate_idx").on(table.candidateId)],
);

export const painRankSnapshots = sqliteTable(
  "pain_rank_snapshots",
  {
    day: text("day").notNull(),
    view: text("view").notNull(),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    score: real("score").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("pain_rank_snapshots_day_view_pain_idx").on(
      table.day,
      table.view,
      table.painId,
    ),
    index("pain_rank_snapshots_day_view_idx").on(table.day, table.view),
  ],
);

export const ingestRuns = sqliteTable(
  "ingest_runs",
  {
    id: text("id").primaryKey(),
    ok: integer("ok", { mode: "boolean" }).$defaultFn(() => true).notNull(),
    summary: text("summary").notNull(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [index("ingest_runs_started_idx").on(table.startedAt)],
);

export const memberProducts = sqliteTable(
  "member_products",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull(),
    targetCustomer: text("target_customer"),
    geography: text("geography"),
    price: text("price"),
    categorySlug: text("category_slug"),
    problemsSolved: text("problems_solved"),
    features: text("features"),
    positioning: text("positioning"),
    ownerOwned: integer("owner_owned", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("member_products_user_idx").on(table.userId)],
);

export const campaignBriefs = sqliteTable(
  "campaign_briefs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    country: text("country").notNull().default("*"),
    destinationUrl: text("destination_url"),
    dailyBudget: text("daily_budget"),
    objective: text("objective").notNull(),
    briefJson: text("brief_json").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("campaign_briefs_user_idx").on(table.userId),
    index("campaign_briefs_pain_idx").on(table.painId),
  ],
);

export const savedSearches = sqliteTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    view: text("view").notNull(),
    category: text("category"),
    country: text("country"),
    products: text("products"),
    programmes: text("programmes"),
    minIntent: integer("min_intent"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("saved_searches_user_idx").on(table.userId)],
);

export const productPrices = sqliteTable(
  "product_prices",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    painId: text("pain_id").references(() => pains.id, { onDelete: "cascade" }),
    display: text("display").notNull(),
    amountPence: integer("amount_pence"),
    currency: text("currency").notNull().default("GBP"),
    sourceLabel: text("source_label").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("product_prices_product_idx").on(table.productId),
    index("product_prices_pain_idx").on(table.painId),
  ],
);

export const priceWatches = sqliteTable(
  "price_watches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    painId: text("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("price_watches_user_product_pain_idx").on(
      table.userId,
      table.productId,
      table.painId,
    ),
  ],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  watchlists: many(watchlists),
  productScans: many(productScans),
  painHypotheses: many(painHypotheses),
  affiliateOffers: many(affiliateOffers),
  offerPainMatches: many(offerPainMatches),
  programmeLeads: many(programmeLeads),
  pageVisits: many(pageVisits),
  roles: many(userRoles),
  profile: one(userProfiles, {
    fields: [user.id],
    references: [userProfiles.userId],
  }),
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
