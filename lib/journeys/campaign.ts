import { SITE_URL } from "@/lib/site";
import type { PainPage } from "@/lib/market/types";
import type {
  CampaignPack,
  PainHypothesisView,
  ProductDna,
  QuizQuestion,
} from "./types";

export function affiliatePainQuestions(painName: string): QuizQuestion[] {
  return [
    {
      id: "uses",
      prompt: `Is this actually your pain: ${painName}?`,
      kind: "yesno",
    },
    {
      id: "when",
      prompt: "When does it show up most?",
      kind: "choice",
      options: [
        "During the day",
        "At night",
        "When I am away",
        "When visitors arrive",
        "During work or video calls",
        "Most of the time",
      ],
    },
    {
      id: "long",
      prompt: "How long has this been a problem?",
      kind: "choice",
      options: ["This week", "A few weeks", "Months", "A year or more"],
    },
    {
      id: "tried",
      prompt: "What have you already tried?",
      kind: "choice",
      options: [
        "Nothing yet",
        "Free advice / YouTube",
        "A product that did not work",
        "Professional help",
      ],
    },
    {
      id: "annoy",
      prompt: "How severe is it, from 1 (mild) to 5 (I need this solved now)?",
      kind: "scale",
    },
    {
      id: "medical",
      prompt:
        "Does this look like a medical or veterinary issue rather than something a product or training programme can honestly help?",
      kind: "yesno",
    },
  ];
}

export function defaultQuestions(painName: string): QuizQuestion[] {
  return [
    {
      id: "uses",
      prompt: `Do you currently deal with this: ${painName}?`,
      kind: "yesno",
    },
    {
      id: "often",
      prompt: "How often does it bother you?",
      kind: "choice",
      options: ["Rarely", "Weekly", "Most days", "Every time I use the product"],
    },
    {
      id: "annoy",
      prompt: "How annoying is it, from 1 (mild) to 5 (I avoid the product)?",
      kind: "scale",
    },
    {
      id: "stopped",
      prompt: "Have you stopped using a product because of this?",
      kind: "yesno",
    },
    {
      id: "buy",
      prompt: "Would a product designed around this make you more likely to buy?",
      kind: "yesno",
    },
    {
      id: "price",
      prompt: "What price would you consider reasonable?",
      kind: "choice",
      options: ["Under £25", "£25–£60", "£60–£120", "£120+"],
    },
  ];
}

export function campaignPackForPain(
  page: PainPage,
  landingPath?: string,
): CampaignPack {
  const landing = `${SITE_URL}${landingPath ?? page.href}`;
  const tracking = `${landing}?utm_source=meta&utm_medium=paid&utm_campaign=${page.slug}`;
  const keywords = [
    ...page.criteria.map((item) => `${item.name.toLowerCase()} ${page.cluster.name.toLowerCase()}`),
    page.title.toLowerCase(),
    `${page.cluster.name.toLowerCase()} that don't ${page.slug.replace(/-/g, " ")}`,
  ].slice(0, 8);
  const headline = page.h1;
  return {
    meta: {
      objective: "Landing page views / leads",
      pain: page.title,
      audience: `${page.cluster.name} users who already feel this pain`,
      destinationUrl: landing,
      trackingUrl: tracking,
      angles: [
        {
          name: "Pain first",
          primaryText: `${page.problem}\n\nTell us where it shows up. PainGraphs will show which option types fit the mix you set — not a generic “best overall” list.`,
          headline,
          cta: "Learn More",
          creativeBrief:
            "Still photo of the product in use, with the painful contact point obvious. No lifestyle smile. Caption the complaint, not the brand.",
        },
        {
          name: "Gave up",
          primaryText: `If you already gave up on ${page.cluster.name.toLowerCase()} because of this, you are the audience. We are testing whether a better option exists.`,
          headline: `The ${page.cluster.name.toLowerCase()} for people who gave up`,
          cta: "Learn More",
          creativeBrief: "Before/after of the painful use vs a calmer alternative. Keep the product unnamed in the first frame.",
        },
        {
          name: "Trade-off",
          primaryText: page.analysis.split("\n\n")[0] ?? page.problem,
          headline: "Stop ranking a winner that ignores your pain",
          cta: "Learn More",
          creativeBrief: "Split layout: silence/absorbency/feature vs comfort. Let the viewer pick the trade-off.",
        },
      ],
    },
    google: {
      campaignName: `PG | Search | ${page.title}`,
      keywords,
      negatives: ["free", "diy", "reddit", "used", "repair"],
      headlines: [
        page.h1.slice(0, 30),
        `Fix ${page.cluster.name} pain`.slice(0, 30),
        "Not a best-overall list".slice(0, 30),
        "Set your own weights".slice(0, 30),
        page.criteria[0]?.name.slice(0, 30) ?? "Compare options",
      ],
      descriptions: [
        page.problem.slice(0, 90),
        "Questionnaire, ranking, and trade-offs. Then pick an option type that fits.",
      ],
      destinationUrl: landing,
      budgetHint: "£15–£30/day for 5–7 days per pain. Kill an angle below 1% quiz start.",
      conversionEvents: [
        "Landing view",
        "Questionnaire start",
        "Questionnaire complete",
        "Email opt-in",
        "Waitlist / affiliate click",
      ],
    },
    email: {
      subject: headline,
      preview: page.problem.slice(0, 90),
      body: `Most lists pick one winner. This page lets you set what actually hurts, then ranks option types against that mix.\n\n${page.problem}\n\nOpen the PainGraph: ${landing}`,
    },
    seo: {
      title: page.h1,
      keywords,
      outline: [
        "What people actually complain about",
        "The trade-off, not a single winner",
        "Who each option type is for",
        "Set your weights and see a PainGraph",
      ],
    },
    organic: organicPack(page.title, page.cluster.name, keywords),
  };
}

export function campaignPackForHypothesis(
  item: Omit<PainHypothesisView, "campaignPack" | "locked">,
  dna: ProductDna,
  landingPath: string,
): CampaignPack {
  const landing = `${SITE_URL}${landingPath}`;
  const tracking = `${landing}?utm_source=meta&utm_medium=paid&utm_campaign=${item.slug ?? "test"}`;
  const keywords = [
    ...dna.keywords.slice(0, 4),
    item.title.toLowerCase(),
    `${dna.name.toLowerCase()} ${item.audience.toLowerCase()}`,
  ].filter(Boolean);
  return {
    meta: {
      objective: "Landing page views / leads",
      pain: item.title,
      audience: item.audience,
      destinationUrl: landing,
      trackingUrl: tracking,
      angles: [
        {
          name: "Pain first",
          primaryText: `${item.problem}\n\nThis is a research page, not a product pitch. Answer a few questions and see whether this pain is yours.`,
          headline: item.h1.slice(0, 40),
          cta: "Learn More",
          creativeBrief: `Show the painful moment (${item.title.toLowerCase()}) without the founder's branding. Dark, close, specific.`,
        },
        {
          name: "Gave up",
          primaryText: `For people who already tried ${dna.name} and still have this problem. We are measuring whether the pain is strong enough to build around.`,
          headline: `Stop pretending ${dna.name} fixed this`,
          cta: "Learn More",
          creativeBrief: "Person putting the product down. Overlay the complaint in their words.",
        },
        {
          name: "Hidden audience",
          primaryText: `Mainstream ads talk to ${dna.forWho}. This test talks to ${item.audience}.`,
          headline: `Built for ${item.audience}`.slice(0, 40),
          cta: "Learn More",
          creativeBrief: "The overlooked audience in situ. No stock handshake.",
        },
      ],
    },
    google: {
      campaignName: `PG | Search | ${item.title}`,
      keywords: keywords.slice(0, 8),
      negatives: ["free", "diy", "reddit", "used", "jobs", "salary"],
      headlines: [
        item.h1.slice(0, 30),
        dna.name.slice(0, 30),
        "Is this your pain?".slice(0, 30),
        item.audience.slice(0, 30),
        "Short questionnaire".slice(0, 30),
      ],
      descriptions: [
        item.problem.slice(0, 90),
        "Answer 6 questions. Get a PainGraph. No purchase required.",
      ],
      destinationUrl: landing,
      budgetHint: "£15–£30/day for 5–7 days per hypothesis. Compare quiz-complete rate, not clicks.",
      conversionEvents: [
        "Landing view",
        "Questionnaire start",
        "Questionnaire complete",
        "I have this problem",
        "Waitlist",
      ],
    },
    email: {
      subject: item.h1,
      preview: item.problem.slice(0, 90),
      body: `${item.problem}\n\nIf this is your pain, the questionnaire takes about a minute.\n\n${landing}`,
    },
    seo: {
      title: item.h1,
      keywords: keywords.slice(0, 8),
      outline: [
        "The suspected problem",
        "Who it affects",
        "What current products miss",
        "Questionnaire",
        "Your PainGraph",
      ],
    },
    organic: organicPack(item.title, dna.name, keywords),
  };
}

export function organicPack(pain: string, cluster: string, keywords: string[]) {
  const topic = pain.toLowerCase();
  return {
    keywords: keywords.slice(0, 10),
    articles: [
      `What people mean when they search “${topic}”`,
      `What they already tried for ${cluster.toLowerCase()}`,
      `How to compare options without a fake #1`,
    ],
    faqs: [
      `Is this the same as a “best ${cluster.toLowerCase()}” list? No. The ranking follows the mix you set.`,
      `Do I have to buy today? No. The page is a decision tool first.`,
    ],
    internalLinks: ["Related pains in the same cluster", "Category hub"],
    calendar: [
      "Week 1: publish the PainGraph",
      "Week 2: FAQ from questionnaire language",
      "Week 3: comparison of option types",
      "Week 4: refresh quotes and scores",
    ],
    videoScript: `Open on the painful moment. Name the complaint in the first line. Do not name the affiliate product until after the questionnaire promise. End on “set your weights”.`,
  };
}
