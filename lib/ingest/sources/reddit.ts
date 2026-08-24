import { fetchJson } from "../http";
import { clip, decodeEntities, sleep } from "../text";
import type { FetchedDoc } from "../types";

type RedditToken = { access_token?: string };
type RedditChild = {
  data?: {
    id?: string;
    permalink?: string;
    title?: string;
    selftext?: string;
    author?: string;
    created_utc?: number;
  };
};
type RedditListing = { data?: { children?: RedditChild[] } };

async function redditToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  return fetchJson<RedditToken>("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
}

export async function fetchReddit(mode: "full" | "cron"): Promise<FetchedDoc[]> {
  const token = await redditToken();
  if (!token?.access_token) return [];

  const subs = mode === "cron" ? ["smallbusiness", "freelance"] : ["smallbusiness", "freelance", "Entrepreneur", "ukbusiness"];
  const queries = mode === "cron"
    ? ["invoice chasing", "looking for software"]
    : ["invoice chasing", "client reporting", "quote follow up", "looking for software"];

  const docs: FetchedDoc[] = [];
  const seen = new Set<string>();

  for (const sub of subs) {
    for (const query of queries) {
      const url = new URL(`https://oauth.reddit.com/r/${sub}/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("restrict_sr", "true");
      url.searchParams.set("sort", "new");
      url.searchParams.set("limit", mode === "cron" ? "5" : "10");
      url.searchParams.set("type", "link");
      try {
        const data = await fetchJson<RedditListing>(url.toString(), {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        for (const child of data.data?.children ?? []) {
          const post = child.data;
          if (!post?.id || !post.title) continue;
          if (seen.has(post.id)) continue;
          seen.add(post.id);
          docs.push({
            sourceSlug: "reddit",
            externalId: post.id,
            url: post.permalink
              ? `https://www.reddit.com${post.permalink}`
              : `https://www.reddit.com/${post.id}`,
            title: decodeEntities(post.title),
            body: clip(decodeEntities(`${post.title}\n\n${post.selftext ?? ""}`)),
            author: post.author ?? null,
            publishedAt: post.created_utc
              ? new Date(post.created_utc * 1000)
              : null,
          });
        }
      } catch (error) {
        console.warn(`Reddit r/${sub} search failed:`, error);
      }
      await sleep(400);
    }
  }

  return docs;
}
