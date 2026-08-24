import { sleep } from "./text";

const USER_AGENT =
  process.env.INGEST_USER_AGENT ??
  "PainGraphs/0.1 (+https://paingraphs.com; demand-intelligence)";

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  retries = 2,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          ...init.headers,
        },
        signal: init.signal ?? AbortSignal.timeout(20000),
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(600 * (attempt + 1));
        lastError = new Error(`${response.status} ${url}`);
        continue;
      }
      if (!response.ok) {
        const error = new Error(`${response.status} ${url}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (
        error instanceof Error &&
        "status" in error &&
        (error as Error & { status: number }).status < 500
      ) {
        throw error;
      }
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}
