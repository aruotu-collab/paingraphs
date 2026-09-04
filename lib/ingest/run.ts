import { eq } from "drizzle-orm";
import { PAINS } from "@/lib/catalog/data";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import { painSignals, pains } from "@/lib/db/schema";
import { ingestBillboard } from "@/lib/billboard/ingest";
import { ingestCustomSearch } from "./custom-search";
import { ingestKeywordPlanner } from "./keyword-planner";
import { ingestClickbankDiscover } from "./clickbank-discover";
import { ingestOpenAIDiscover } from "./openai-discover";
import { ingestRedditDiscover } from "./reddit-discover";
import { ingestOpenAISearch } from "./openai-search";
import { ingestSearchConsole } from "./search-console";
import { ingestVertexSearch } from "./vertex-search";
import { getJson, hash, storeSignal } from "./signals";

const PAIN_SHAPE =
  /i love this but|the only problem|does anyone else|this hurts|i wish they|why don't they|it would be perfect if|doesn't|don't|too loud|rustle|sting|rub|scare|pressure|clamp/i;

export async function runIngest() {
  await ensureCatalog();
  const billboard = await ingestBillboard();
  const youtube = await ingestYoutube();
  const searchConsole = await ingestSearchConsole();
  const vertexSearch = await ingestVertexSearch();
  const clickbankDiscover = await ingestClickbankDiscover();
  const redditDiscover = await ingestRedditDiscover();
  const openaiDiscover = await ingestOpenAIDiscover();
  const openaiSearch = await ingestOpenAISearch();
  const customSearch = await ingestCustomSearch();
  const keywordPlanner = await ingestKeywordPlanner();
  await refreshTrends();

  const sources = ["catalog"];
  if (billboard.updated > 0) sources.push("billboard");
  if (youtube > 0) sources.push("youtube");
  if (searchConsole > 0) sources.push("search-console");
  if (vertexSearch.stored + vertexSearch.engineResults > 0) {
    sources.push("vertex-search");
  }
  if (clickbankDiscover.pains + clickbankDiscover.quotes > 0) {
    sources.push("clickbank-discover");
  }
  if (redditDiscover.pains + redditDiscover.quotes > 0) {
    sources.push("reddit-discover");
  }
  if (openaiDiscover.pains + openaiDiscover.quotes > 0) sources.push("openai-discover");
  if (openaiSearch > 0) sources.push("openai");
  if (customSearch.stored + customSearch.competitionHints > 0) sources.push("custom-search");
  if (keywordPlanner > 0) sources.push("keyword-planner");

  return {
    catalog: PAINS.length,
    billboardTopics: billboard.updated,
    billboardDate: billboard.chartDate,
    discoveredPains: openaiDiscover.pains + clickbankDiscover.pains + redditDiscover.pains,
    discoveredQuotes: openaiDiscover.quotes + clickbankDiscover.quotes + redditDiscover.quotes,
    youtubeComments: youtube,
    searchConsoleQueries: searchConsole,
    vertexSearchResults: vertexSearch.stored + vertexSearch.engineResults,
    openaiSearchResults: openaiSearch,
    customSearchResults: customSearch.stored,
    customSearchCompetitionHints: customSearch.competitionHints,
    keywordPlannerIdeas: keywordPlanner,
    sources,
  };
}

async function ingestYoutube() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return 0;
  let stored = 0;
  for (const pain of PAINS) {
    for (const query of pain.youtubeQueries.slice(0, 1)) {
      const videos = await searchVideos(key, query);
      for (const videoId of videos.slice(0, 2)) {
        const comments = await videoComments(key, videoId);
        for (const comment of comments) {
          if (!PAIN_SHAPE.test(comment.text)) continue;
          const added = await storeSignal({
            id: `yt-${pain.id}-${hash(comment.id)}`,
            painId: pain.id,
            rawQuote: comment.text,
            sourceKind: "youtube",
            sourceLabel: "YouTube comment",
            sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
            publishedAt: comment.publishedAt,
          });
          if (added) stored += 1;
        }
      }
    }
  }
  return stored;
}

async function searchVideos(key: string, query: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("q", query);
  url.searchParams.set("key", key);
  const data = await getJson<{ items?: { id?: { videoId?: string } }[] }>(url);
  return (data.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));
}

async function videoComments(key: string, videoId: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("textFormat", "plainText");
  url.searchParams.set("key", key);
  const data = await getJson<{
    items?: {
      id?: string;
      snippet?: {
        topLevelComment?: {
          snippet?: { textDisplay?: string; publishedAt?: string };
        };
      };
    }[];
  }>(url);
  return (data.items ?? [])
    .map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      text: item.snippet?.topLevelComment?.snippet?.textDisplay ?? "",
      publishedAt: item.snippet?.topLevelComment?.snippet?.publishedAt
        ? new Date(item.snippet.topLevelComment.snippet.publishedAt)
        : null,
    }))
    .filter((row) => row.text.length > 24);
}

async function refreshTrends() {
  const rows = await db.select().from(pains);
  for (const pain of rows) {
    const seed = PAINS.find((item) => item.id === pain.id);
    const signals = await db
      .select()
      .from(painSignals)
      .where(eq(painSignals.painId, pain.id));
    const youtube = signals.filter((row) => row.sourceKind === "youtube").length;
    const gsc = signals.filter((row) => row.sourceKind === "gsc").length;
    const cse = signals.filter((row) => row.sourceKind === "cse").length;
    const vertex = signals.filter((row) => row.sourceKind === "vertex").length;
    const openai = signals.filter((row) => row.sourceKind === "openai").length;
    const ads = signals.filter((row) => row.sourceKind === "ads").length;
    const live = Math.min(24, youtube * 2 + gsc + cse + vertex + openai + ads * 2);
    const baseline = seed?.trend ?? pain.trend;
    await db
      .update(pains)
      .set({
        trend: Math.max(-20, Math.min(80, baseline + live)),
        organicScore: Math.min(99, (seed?.organicScore ?? pain.organicScore) + Math.min(6, gsc)),
        intentScore: Math.min(99, (seed?.intentScore ?? pain.intentScore) + Math.min(5, ads + gsc)),
        opportunity: Math.min(
          99,
          (seed?.opportunity ?? pain.opportunity) +
            Math.min(6, youtube + gsc + vertex + openai + ads),
        ),
        updatedAt: new Date(),
      })
      .where(eq(pains.id, pain.id));
  }
}
