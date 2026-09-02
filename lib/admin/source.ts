const SITE_HOSTS = /(^|\.)paingraphs\.com$|(^|\.)localhost$|paingraphs\.vercel\.app$/i;

const HOST_SOURCES: [RegExp, string][] = [
  [/chatgpt\.com|chat\.openai\.com|(^|\.)openai\.com$/i, "ChatGPT"],
  [/claude\.ai|(^|\.)anthropic\.com$/i, "Claude"],
  [/perplexity\.ai/i, "Perplexity"],
  [/gemini\.google|bard\.google/i, "Gemini"],
  [/copilot\.microsoft|bing\.com\/chat/i, "Copilot"],
  [/(^|\.)you\.com$/i, "You.com"],
  [/google\./i, "Google"],
  [/bing\.|msn\.com/i, "Bing"],
  [/duckduckgo/i, "DuckDuckGo"],
  [/yahoo\./i, "Yahoo"],
  [/facebook\.|fb\.com|instagram\.|l\.facebook/i, "Meta"],
  [/(^|\.)x\.com$|(^|\.)twitter\.com$|(^|\.)t\.co$/i, "X / Twitter"],
  [/linkedin\./i, "LinkedIn"],
  [/reddit\./i, "Reddit"],
  [/youtube\.|youtu\.be/i, "YouTube"],
  [/tiktok\./i, "TikTok"],
  [/pinterest\./i, "Pinterest"],
  [/baidu\./i, "Baidu"],
  [/yandex\./i, "Yandex"],
  [/threads\.net/i, "Threads"],
  [/whatsapp\.|wa\.me/i, "WhatsApp"],
  [/telegram\.|t\.me/i, "Telegram"],
];

const UTM_SOURCES: [RegExp, string][] = [
  [/chatgpt|openai/i, "ChatGPT"],
  [/claude|anthropic/i, "Claude"],
  [/perplexity/i, "Perplexity"],
  [/gemini|bard/i, "Gemini"],
  [/copilot/i, "Copilot"],
  [/google|adwords|gads/i, "Google"],
  [/bing|microsoft/i, "Bing"],
  [/facebook|meta|ig|instagram/i, "Meta"],
  [/twitter|x($|[-_])/i, "X / Twitter"],
  [/linkedin/i, "LinkedIn"],
  [/reddit/i, "Reddit"],
  [/youtube|yt/i, "YouTube"],
  [/newsletter|email|mailchimp|beehiiv/i, "Email"],
];

export type ClassifiedSource = {
  source: string;
  host: string | null;
};

export function classifyVisit(input: {
  referrer?: string | null;
  landingReferrer?: string | null;
  query?: string | null;
  userAgent?: string | null;
}): ClassifiedSource {
  const query = input.query ?? "";
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const utm = params.get("utm_source") || params.get("utm_medium") || "";
  const utmHit = matchPairs(utm, UTM_SOURCES);
  if (utmHit) {
    return { source: utmHit, host: hostFrom(input.landingReferrer || input.referrer) };
  }
  if (params.has("gclid") || params.has("gbraid") || params.has("wbraid")) {
    return { source: "Google Ads", host: hostFrom(input.referrer) };
  }
  if (params.has("fbclid")) {
    return { source: "Meta", host: hostFrom(input.referrer) };
  }
  if (params.has("msclkid")) {
    return { source: "Bing", host: hostFrom(input.referrer) };
  }

  const ua = input.userAgent || "";
  const uaSource = classifyUserAgent(ua);
  if (uaSource) return { source: uaSource, host: hostFrom(input.referrer) };

  const landing = input.landingReferrer ?? "";
  const current = input.referrer ?? "";
  const external = firstExternal(landing) || firstExternal(current);
  if (external) {
    const host = hostFrom(external);
    const named = host ? matchPairs(host, HOST_SOURCES) : null;
    return {
      source: named || host || "Referral",
      host,
    };
  }

  if (isInternal(current) || isInternal(landing)) {
    return { source: "Internal", host: hostFrom(current || landing) };
  }

  return { source: "Direct", host: null };
}

function classifyUserAgent(ua: string) {
  if (/chatgpt-user|gptbot/i.test(ua)) return "ChatGPT";
  if (/claude-user|claudebot|anthropic-ai/i.test(ua)) return "Claude";
  if (/perplexity/i.test(ua)) return "Perplexity";
  if (/google-extended|googlebot/i.test(ua)) return "Googlebot";
  if (/bingbot/i.test(ua)) return "Bingbot";
  if (/bytespider/i.test(ua)) return "Bytespider";
  return null;
}

function firstExternal(raw: string) {
  if (!raw.trim()) return null;
  if (isInternal(raw)) return null;
  return raw;
}

function isInternal(raw: string) {
  const host = hostFrom(raw);
  return Boolean(host && SITE_HOSTS.test(host));
}

function hostFrom(raw?: string | null) {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return host.slice(0, 80) || null;
  } catch {
    return null;
  }
}

function matchPairs(value: string, pairs: [RegExp, string][]) {
  if (!value) return null;
  return pairs.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}
