import { PAINS } from "@/lib/catalog/data";
import { cleanComplaintQuote, looksLikeSpokenComplaint } from "@/lib/market/quotes";
import { googleServiceAccountToken } from "./google-auth";
import { getJson, hash, storeSignal } from "./signals";

const PROJECT =
  process.env.GOOGLE_CLOUD_PROJECT ?? "acquired-vector-484817-g6";
const LOCATION = process.env.VERTEX_LOCATION ?? "global";
const MODEL = process.env.VERTEX_MODEL ?? "gemini-3.7-flash";

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingSupports?: {
        segment?: { text?: string };
      }[];
    };
  }[];
  error?: { message?: string };
};

type DiscoveryResult = {
  results?: {
    document?: {
      derivedStructData?: {
        title?: string;
        link?: string;
        snippets?: { snippet?: string }[];
      };
    };
  }[];
  totalSize?: number;
};

export async function ingestVertexSearch() {
  const token = await googleServiceAccountToken(
    "https://www.googleapis.com/auth/cloud-platform",
  );
  if (!token) return { stored: 0, engineResults: 0 };

  const grounded = await ingestGroundedWeb(token);
  const engine = await ingestDiscoveryEngine(token);
  return {
    stored: grounded,
    engineResults: engine,
  };
}

async function ingestGroundedWeb(token: string) {
  let stored = 0;
  for (const pain of PAINS) {
    const query = pain.searchPhrases[0];
    if (!query) continue;
    const host =
      LOCATION === "global"
        ? "https://aiplatform.googleapis.com"
        : `https://${LOCATION}-aiplatform.googleapis.com`;
    const data = await getJson<GeminiResponse>(
      `${host}/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-goog-user-project": PROJECT,
        },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Search the public web for recent consumer complaints and product-fit problems about: "${query}". Quote short real-world pain language only. Do not invent reviews.`,
                },
              ],
            },
          ],
          tools: [
            {
              googleSearch: {
                excludeDomains: ["reddit.com", "www.reddit.com"],
              },
            },
          ],
        }),
      },
    );

    const candidate = data.candidates?.[0];
    const supports = candidate?.groundingMetadata?.groundingSupports ?? [];

    for (const support of supports.slice(0, 3)) {
      const text = cleanComplaintQuote(support.segment?.text ?? "");
      if (text.length < 28) continue;
      if (!looksLikeSpokenComplaint(text) && text.split(/\s+/).length < 8) continue;
      const added = await storeSignal({
        id: `vertex-${pain.id}-${hash(text)}`,
        painId: pain.id,
        rawQuote: text,
        sourceKind: "vertex",
        sourceLabel: "Vertex AI Search",
      });
      if (added) stored += 1;
    }

  }
  return stored;
}

async function ingestDiscoveryEngine(token: string) {
  const engineId = process.env.VERTEX_SEARCH_ENGINE_ID;
  if (!engineId) return 0;

  let stored = 0;
  for (const pain of PAINS) {
    const query = pain.searchPhrases[0];
    if (!query) continue;
    const data = await getJson<DiscoveryResult>(
      `https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/engines/${engineId}/servingConfigs/default_search:search`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-goog-user-project": PROJECT,
        },
        body: JSON.stringify({
          query,
          pageSize: 5,
          languageCode: "en-GB",
          safeSearch: true,
          contentSearchSpec: {
            snippetSpec: { returnSnippet: true, maxSnippetCount: 1 },
          },
        }),
      },
    );

    for (const row of (data.results ?? []).slice(0, 3)) {
      const item = row.document?.derivedStructData;
      const title = item?.title ?? "";
      const snippet = item?.snippets?.[0]?.snippet ?? "";
      const text = cleanComplaintQuote(snippet || title);
      if (text.length < 28 || !looksLikeSpokenComplaint(text)) continue;
      const added = await storeSignal({
        id: `vertex-eng-${pain.id}-${hash(item?.link ?? text)}`,
        painId: pain.id,
        rawQuote: text,
        sourceKind: "vertex",
        sourceLabel: "Vertex AI Search app",
        sourceUrl: item?.link ?? null,
      });
      if (added) stored += 1;
    }
  }
  return stored;
}
