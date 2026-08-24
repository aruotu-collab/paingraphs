export const INDUSTRIES = [
  { id: "industry-professional-services", slug: "professional-services", name: "Professional services" },
  { id: "industry-freelance", slug: "freelance", name: "Freelance" },
  { id: "industry-construction", slug: "construction", name: "Construction" },
  { id: "industry-hospitality", slug: "hospitality", name: "Hospitality" },
  { id: "industry-real-estate", slug: "real-estate", name: "Real estate" },
  { id: "industry-software", slug: "software", name: "Software" },
  { id: "industry-finance", slug: "finance", name: "Finance" },
  { id: "industry-other", slug: "other", name: "Other" },
] as const;

export const NICHES = [
  { id: "niche-agencies", industryId: "industry-professional-services", slug: "agencies", name: "Agencies" },
  { id: "niche-accountants", industryId: "industry-professional-services", slug: "accountants", name: "Accountants" },
  { id: "niche-contractors", industryId: "industry-freelance", slug: "independent-contractors", name: "Independent contractors" },
  { id: "niche-trades", industryId: "industry-construction", slug: "independent-trades", name: "Independent trades" },
  { id: "niche-hosts", industryId: "industry-hospitality", slug: "short-term-rental", name: "Short-term rental hosts" },
  { id: "niche-agents", industryId: "industry-real-estate", slug: "estate-agents", name: "Estate agents" },
  { id: "niche-founders", industryId: "industry-software", slug: "founders", name: "Founders" },
  { id: "niche-developers", industryId: "industry-software", slug: "developers", name: "Developers" },
] as const;

export const COUNTRIES = [
  { id: "country-uk", code: "UK", name: "United Kingdom" },
  { id: "country-us", code: "US", name: "United States" },
  { id: "country-global", code: "GLOBAL", name: "Global" },
] as const;

export const PERSONAS = [
  { id: "persona-agency-owner", slug: "agency-owner", name: "Agency owner" },
  { id: "persona-freelancer", slug: "freelancer", name: "Freelancer" },
  { id: "persona-owner-operator", slug: "owner-operator", name: "Owner-operator" },
  { id: "persona-property-manager", slug: "property-manager", name: "Property manager" },
  { id: "persona-branch-manager", slug: "branch-manager", name: "Branch manager" },
  { id: "persona-founder", slug: "founder", name: "Founder" },
  { id: "persona-developer", slug: "developer", name: "Developer" },
  { id: "persona-accountant", slug: "accountant", name: "Accountant" },
] as const;

export const SOURCES = [
  { id: "source-hn", slug: "hn", name: "Hacker News", kind: "api", baseUrl: "https://news.ycombinator.com" },
  { id: "source-github", slug: "github", name: "GitHub Issues", kind: "api", baseUrl: "https://api.github.com" },
  { id: "source-stackexchange", slug: "stackexchange", name: "Stack Exchange", kind: "api", baseUrl: "https://api.stackexchange.com" },
  { id: "source-reddit", slug: "reddit", name: "Reddit", kind: "api", baseUrl: "https://oauth.reddit.com" },
] as const;

export type ClusterTemplate = {
  slug: string;
  title: string;
  summary: string;
  phrases: string[];
  keywords: string[];
  industryId: string;
  nicheId: string;
  personaId: string;
  countryId: string;
};

export const CLUSTER_TEMPLATES: ClusterTemplate[] = [
  {
    slug: "freelancer-invoice-chasing",
    title: "Freelancer invoice chasing",
    summary: "Independent workers lose time and cash flow chasing unpaid invoices.",
    phrases: ["invoice chasing", "late invoice", "overdue invoice", "get paid", "chase payment"],
    keywords: ["invoice", "invoices", "payment", "overdue", "freelancer", "late"],
    industryId: "industry-freelance",
    nicheId: "niche-contractors",
    personaId: "persona-freelancer",
    countryId: "country-uk",
  },
  {
    slug: "automated-client-reporting",
    title: "Automated client reporting",
    summary: "Agencies and consultants still assemble client updates by hand.",
    phrases: ["client reporting", "status report", "client update", "weekly report"],
    keywords: ["agency", "client", "reporting", "report", "deck", "status"],
    industryId: "industry-professional-services",
    nicheId: "niche-agencies",
    personaId: "persona-agency-owner",
    countryId: "country-us",
  },
  {
    slug: "trades-quote-follow-up",
    title: "Quote follow-up for small trades",
    summary: "Tradespeople lose jobs because quote follow-up is manual.",
    phrases: ["quote follow", "follow up quote", "chase quote", "estimate follow"],
    keywords: ["quote", "quotes", "trades", "builder", "plumber", "electrician", "van"],
    industryId: "industry-construction",
    nicheId: "niche-trades",
    personaId: "persona-owner-operator",
    countryId: "country-uk",
  },
  {
    slug: "lead-follow-up-leakage",
    title: "Lead follow-up leakage",
    summary: "Sales and agency leads go cold because follow-up depends on memory.",
    phrases: ["lead follow", "follow up leads", "leads going cold", "enquiry follow"],
    keywords: ["lead", "leads", "crm", "follow", "enquiry", "pipeline"],
    industryId: "industry-real-estate",
    nicheId: "niche-agents",
    personaId: "persona-branch-manager",
    countryId: "country-uk",
  },
  {
    slug: "airbnb-turnover-coordination",
    title: "Short-term rental turnover coordination",
    summary: "Hosts juggle cleaners and calendars across portals.",
    phrases: ["turnover", "cleaner schedule", "airbnb cleaning", "str cleaning"],
    keywords: ["airbnb", "cleaner", "turnover", "host", "rental", "booking"],
    industryId: "industry-hospitality",
    nicheId: "niche-hosts",
    personaId: "persona-property-manager",
    countryId: "country-us",
  },
  {
    slug: "invoice-and-bookkeeping-busywork",
    title: "Invoice and bookkeeping busywork",
    summary: "Owners still stitch spreadsheets, banks, and tax rules by hand.",
    phrases: ["bookkeeping", "vat return", "hmrc", "quickbooks", "xero"],
    keywords: ["invoice", "tax", "accounting", "spreadsheet", "bookkeeping", "vat"],
    industryId: "industry-finance",
    nicheId: "niche-accountants",
    personaId: "persona-accountant",
    countryId: "country-uk",
  },
];

export function countryIdFromHint(hint: "UK" | "US" | "GLOBAL") {
  if (hint === "UK") return "country-uk";
  if (hint === "US") return "country-us";
  return "country-global";
}
