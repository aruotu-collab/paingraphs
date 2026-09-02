import { db } from "@/lib/db";
import { painSignals } from "@/lib/db/schema";

export async function storeSignal(input: {
  id: string;
  painId: string;
  rawQuote: string;
  sourceKind: string;
  sourceLabel: string;
  sourceUrl?: string | null;
  publishedAt?: Date | null;
}) {
  try {
    await db.insert(painSignals).values({
      id: input.id,
      painId: input.painId,
      rawQuote: input.rawQuote.slice(0, 420),
      sourceKind: input.sourceKind,
      sourceLabel: input.sourceLabel,
      sourceUrl: input.sourceUrl ?? null,
      publishedAt: input.publishedAt ?? null,
    });
    return true;
  } catch {
    return false;
  }
}

export function hash(value: string) {
  let h = 0;
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h.toString(16);
}

export async function getJson<T>(
  url: URL | string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    console.warn(`ingest ${response.status} ${url.toString().split("?")[0]} ${body.slice(0, 180)}`);
    return {} as T;
  }
  return (await response.json()) as T;
}
