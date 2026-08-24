import { fetchJson } from "../http";
import { clip, decodeEntities, sleep } from "../text";
import type { FetchedDoc } from "../types";

type GhIssue = {
  id: number;
  html_url: string;
  title: string;
  body?: string | null;
  created_at?: string;
  user?: { login?: string };
};

type GhResponse = { items?: GhIssue[]; message?: string };

export async function fetchGitHub(mode: "full" | "cron"): Promise<FetchedDoc[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const queries = (
    mode === "cron"
      ? ['is:issue "looking for a tool"', 'is:issue "invoice reminder"']
      : [
          'is:issue "looking for a tool" OR "is there a tool"',
          'is:issue "invoice reminder" OR "chase invoices"',
          'is:issue "client report" automation',
          'is:issue "follow up quotes"',
        ]
  ).slice(0, token ? undefined : 2);

  const perPage = mode === "cron" ? 5 : 8;
  const docs: FetchedDoc[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const url = new URL("https://api.github.com/search/issues");
    url.searchParams.set("q", query);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("sort", "updated");
    try {
      const data = await fetchJson<GhResponse>(url.toString(), { headers }, 1);
      for (const item of data.items ?? []) {
        const id = String(item.id);
        if (seen.has(id)) continue;
        seen.add(id);
        docs.push({
          sourceSlug: "github",
          externalId: id,
          url: item.html_url,
          title: decodeEntities(item.title),
          body: clip(decodeEntities(`${item.title}\n\n${item.body ?? ""}`)),
          author: item.user?.login ?? null,
          publishedAt: item.created_at ? new Date(item.created_at) : null,
        });
      }
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        console.warn("GitHub search skipped (auth/rate limit). Set GITHUB_TOKEN for this source.");
        break;
      }
      console.warn("GitHub search failed:", error);
    }
    await sleep(250);
  }

  return docs;
}
