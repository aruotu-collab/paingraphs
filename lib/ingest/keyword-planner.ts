import { PAINS } from "@/lib/catalog/data";
import { getJson, hash, storeSignal } from "./signals";

type Idea = {
  text?: string;
  keywordIdeaMetrics?: {
    avgMonthlySearches?: string | number;
    competition?: string;
    competitionIndex?: string | number;
  };
};

export async function ingestKeywordPlanner() {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return 0;
  }

  const token = await adsAccessToken(clientId, clientSecret, refreshToken);
  if (!token) return 0;

  let stored = 0;
  const loginCustomer = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  for (const pain of PAINS) {
    const keywords = pain.searchPhrases.slice(0, 3);
    if (keywords.length === 0) continue;
    const data = await getJson<{ results?: { keywordIdea?: Idea }[] }>(
      `https://googleads.googleapis.com/v18/customers/${customerId}:generateKeywordIdeas`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "developer-token": developerToken,
          "content-type": "application/json",
          ...(loginCustomer ? { "login-customer-id": loginCustomer } : {}),
        },
        body: JSON.stringify({
          customerId,
          language: "languageConstants/1000",
          geoTargetConstants: ["geoTargetConstants/2826"],
          keywordSeed: { keywords },
        }),
      },
    );

    for (const row of (data.results ?? []).slice(0, 5)) {
      const idea = row.keywordIdea;
      const phrase = idea?.text;
      if (!phrase) continue;
      const volume = idea?.keywordIdeaMetrics?.avgMonthlySearches ?? 0;
      const competition = idea?.keywordIdeaMetrics?.competition ?? "UNSPECIFIED";
      const added = await storeSignal({
        id: `ads-${pain.id}-${hash(phrase)}`,
        painId: pain.id,
        rawQuote: `${phrase} · ~${volume} monthly searches · competition ${String(competition).toLowerCase()}`,
        sourceKind: "ads",
        sourceLabel: "Keyword Planner",
      });
      if (added) stored += 1;
    }
  }
  return stored;
}

async function adsAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
) {
  const data = await getJson<{ access_token?: string }>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    },
  );
  return data.access_token ?? null;
}
