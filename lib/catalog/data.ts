import type {
  CatalogCategory,
  CatalogCluster,
  CatalogPain,
  CatalogProduct,
} from "./types";

export const CATEGORIES: CatalogCategory[] = [
  {
    id: "cat-electronics",
    slug: "electronics",
    name: "Electronics",
    summary: "Wearables, audio, and gadgets that fail in daily use.",
  },
  {
    id: "cat-personal-care",
    slug: "personal-care",
    name: "Personal care",
    summary: "Protection and body-care products where discretion and comfort matter.",
  },
  {
    id: "cat-skincare",
    slug: "skincare",
    name: "Skincare",
    summary: "Formulas that sting, clog, or fail sensitive skin.",
  },
  {
    id: "cat-home",
    slug: "home",
    name: "Home",
    summary: "Household tools that are too loud, bulky, or stressful for shared spaces.",
  },
  {
    id: "cat-clothes",
    slug: "clothes",
    name: "Clothes",
    summary: "Fit, chafe, and support problems in daily clothing.",
  },
  {
    id: "cat-shoes",
    slug: "shoes",
    name: "Shoes",
    summary: "Footwear that rubs, slips, or cannot last a standing day.",
  },
];

export const CLUSTERS: CatalogCluster[] = [
  {
    id: "cl-headphones",
    categoryId: "cat-electronics",
    slug: "headphones",
    name: "Headphones",
    summary: "Fit, clamp, heat, and glasses compatibility.",
  },
  {
    id: "cl-discreet",
    categoryId: "cat-personal-care",
    slug: "discreet-protection",
    name: "Discreet protection",
    summary: "Noise, bulk, and visibility in bladder protection.",
  },
  {
    id: "cl-sunscreen",
    categoryId: "cat-skincare",
    slug: "sunscreen",
    name: "Sunscreen",
    summary: "Sting, white cast, and wear under makeup.",
  },
  {
    id: "cl-vacuum",
    categoryId: "cat-home",
    slug: "vacuum",
    name: "Vacuums",
    summary: "Noise, pet fear, and hair pickup.",
  },
  {
    id: "cl-fit",
    categoryId: "cat-shoes",
    slug: "all-day-fit",
    name: "All-day fit",
    summary: "Rubbing, slipping, and standing fatigue.",
  },
];

export const PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-open-ear",
    slug: "open-ear-or-soft-clamp",
    name: "Open-ear or low-clamp headset",
    summary:
      "These sit off the temple, so the arms of your glasses are not trapped between the pad and your skull.",
    whoFor: "Best if the main problem is glasses arms being pressed into your head.",
    searchQuery: "open ear headphones glasses comfortable",
    priceBand: "£40–£180",
  },
  {
    id: "prod-on-ear-light",
    slug: "lightweight-on-ear",
    name: "Lightweight on-ear",
    summary:
      "Smaller and lighter than a full over-ear cup. They can still pinch if the band is tight.",
    whoFor: "Best if weight and heat bother you more than the squeeze on your glasses.",
    searchQuery: "lightweight on ear headphones",
    priceBand: "£25–£90",
  },
  {
    id: "prod-overear-plush",
    slug: "plush-over-ear",
    name: "Plush deep-cup over-ear",
    summary:
      "Soft pads can take the edge off, but a deep clamp often still traps your frames after an hour.",
    whoFor: "Best if you want to block noise and you do not wear thick frames.",
    searchQuery: "memory foam over ear headphones",
    priceBand: "£60–£280",
  },
  {
    id: "prod-quiet-underwear",
    slug: "cloth-quiet-underwear",
    name: "Cloth-backed absorbent underwear",
    summary: "Fabric outer usually rustles less than plastic-backed pads.",
    whoFor: "Best if quietness is the top priority.",
    searchQuery: "quiet incontinence underwear cloth backed",
    priceBand: "£8–£18 / pack",
  },
  {
    id: "prod-thin-liner",
    slug: "thin-work-liner",
    name: "Thin shaped liner",
    summary: "Lower bulk under fitted clothes; absorbency ceiling is lower.",
    whoFor: "Best for fitted clothing and lighter needs.",
    searchQuery: "thin discreet bladder liners women",
    priceBand: "£4–£10 / pack",
  },
  {
    id: "prod-max-absorb",
    slug: "high-absorbency-guard",
    name: "High-absorbency guard",
    summary: "More capacity, usually more rustle and outline.",
    whoFor: "Best if absorbency matters more than silence.",
    searchQuery: "maximum absorbency incontinence underwear",
    priceBand: "£10–£22 / pack",
  },
  {
    id: "prod-mineral-fluid",
    slug: "fluid-mineral-sunscreen",
    name: "Fluid mineral sunscreen",
    summary: "Zinc/titanium in a fluid base, often less sting than chemical filters.",
    whoFor: "Best if sting around the eyes is the main complaint.",
    searchQuery: "mineral sunscreen does not sting eyes",
    priceBand: "£12–£32",
  },
  {
    id: "prod-chemical-sport",
    slug: "sport-chemical-sunscreen",
    name: "Sport chemical sunscreen",
    summary: "Strong sweat resistance; more likely to migrate into eyes.",
    whoFor: "Best for long outdoor sessions if sting is not your issue.",
    searchQuery: "sport sunscreen sweat resistant",
    priceBand: "£8–£22",
  },
  {
    id: "prod-quiet-stick",
    slug: "quiet-stick-vacuum",
    name: "Low-decibel stick vacuum",
    summary: "Quieter motors; still a visible moving object for anxious dogs.",
    whoFor: "Best if noise is the main trigger.",
    searchQuery: "quiet stick vacuum for pets",
    priceBand: "£150–£400",
  },
  {
    id: "prod-robot-sched",
    slug: "scheduled-robot-vacuum",
    name: "Scheduled robot vacuum",
    summary: "Can run while the dog is out. Mapping helps avoid sudden lunges.",
    whoFor: "Best if the dog panics at a person holding a vacuum.",
    searchQuery: "quiet robot vacuum pets",
    priceBand: "£200–£700",
  },
  {
    id: "prod-wide-toe",
    slug: "wide-toe-soft-upper",
    name: "Wide-toe soft-upper shoe",
    summary: "Room over the bunion and fewer seams at the joint.",
    whoFor: "Best if rubbing on the bunion is the main pain.",
    searchQuery: "wide toe box shoes bunions women",
    priceBand: "£70–£160",
  },
  {
    id: "prod-cushion-trainer",
    slug: "high-cushion-trainer",
    name: "High-cushion trainer",
    summary: "Helps standing fatigue; may still rub if the toe box is tapered.",
    whoFor: "Best if you stand all day and bunions are mild.",
    searchQuery: "cushioned trainers all day standing",
    priceBand: "£80–£180",
  },
];

export const PAINS: CatalogPain[] = [
  {
    id: "pain-glasses",
    clusterId: "cl-headphones",
    slug: "glasses-pressure",
    title: "Headphones that do not hurt with glasses",
    h1: "Headphones that do not hurt when you wear glasses",
    problem:
      "Over-ear cups trap spectacle arms against the skull. After 20–60 minutes the temple aches, the frames slip, or both.",
    analysis:
      "Most “best headphones for glasses” lists still pick a closed-back studio headphone. Those block outside noise, and they also press the arms of your glasses into your head. Soft pads do not fix a tight band — the frames still get sandwiched between the cup and your skull.\n\nThe real choice is how much squeeze, weight, and heat you will accept in exchange for silence. There is no single winner here. The ranking at the bottom is for the mix you set with the sliders, not for a reviewer who does not wear glasses.",
    whyNow:
      "Work calls got longer, and people kept their glasses on. The ache that used to show up on a long flight now shows up every weekday. That is why this is a product problem, not a niche complaint.",
    strategy: "affiliate now → own product later",
    stage: 4,
    painScore: 91,
    intentScore: 88,
    competitionScore: 46,
    productGap: 62,
    affiliateScore: 84,
    organicScore: 90,
    opportunity: 88,
    trend: 43,
    sensitive: false,
    related: [],
    searchPhrases: [
      "headphones that don't hurt with glasses",
      "headphones pressing glasses into head",
      "comfortable headphones for glasses wearers",
    ],
    youtubeQueries: [
      "headphones for glasses wearers",
      "headphones hurt with glasses",
    ],
    criteria: [
      {
        slug: "clamp",
        name: "Clamp / temple pinch",
        detail:
          "How hard the headphones squeeze. That squeeze presses your glasses arms into the side of your head.",
      },
      {
        slug: "weight",
        name: "Weight",
        detail:
          "How heavy they feel on top of your head and on your ears after a long session.",
      },
      {
        slug: "heat",
        name: "Heat",
        detail: "How hot and sweaty the ear cups get on a long call or commute.",
      },
      {
        slug: "isolation",
        name: "Isolation",
        detail:
          "How much they block outside noise. Better silence usually means a tighter, more sealed cup — which often hurts more with glasses.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "What you are willing to spend for something you will wear every day.",
      },
    ],
    products: [
      {
        productId: "prod-open-ear",
        scores: { clamp: 92, weight: 80, heat: 88, isolation: 35, price: 70 },
        note: "This type leaves space at the temple, so glasses arms are not pinched. You will hear more of the room than with a sealed over-ear cup.",
      },
      {
        productId: "prod-on-ear-light",
        scores: { clamp: 68, weight: 86, heat: 74, isolation: 48, price: 82 },
        note: "Lighter and cooler than a big over-ear. A tight band can still press thin frames into your head.",
      },
      {
        productId: "prod-overear-plush",
        scores: { clamp: 44, weight: 52, heat: 40, isolation: 90, price: 55 },
        note: "Best at blocking noise. Soft pads help a little, but after about an hour the clamp often still traps your frames.",
      },
    ],
    signals: [
      {
        rawQuote:
          "I can't wear over-ear headphones because my glasses dig into my skull after an hour.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
      {
        rawQuote:
          "The pads are soft but the clamp still pushes my frames into my temple on calls.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
  {
    id: "pain-quiet",
    clusterId: "cl-discreet",
    slug: "quiet",
    title: "Quiet incontinence underwear",
    h1: "Quiet incontinence protection for people who care about discretion",
    problem:
      "Plastic-backed products rustle when you walk, sit, or use a bathroom. The fear is detection, not just leakage.",
    analysis:
      "Quietness is a materials problem: outer film vs cloth, pad wings vs shaped underwear, and how the product moves at the hip. Absorbency and silence trade off. Ranking ‘#1 overall’ hides that. A cloth-backed underwear cut is usually quieter than a plastic pad; a max-absorb guard is usually louder and more visible.",
    whyNow:
      "Search language is shifting from ‘adult nappy’ to ‘discreet’, ‘quiet’, and ‘doesn’t show’ — people are shopping the fear, not the clinical category.",
    strategy: "affiliate now → validate own product later",
    stage: 4,
    painScore: 93,
    intentScore: 90,
    competitionScore: 58,
    productGap: 74,
    affiliateScore: 80,
    organicScore: 86,
    opportunity: 87,
    trend: 31,
    sensitive: true,
    related: ["pain-thin"],
    searchPhrases: [
      "quiet incontinence underwear",
      "incontinence underwear that doesn't make noise",
      "discreet protection for travelling",
    ],
    youtubeQueries: [
      "quiet incontinence products",
      "discreet bladder underwear review",
    ],
    criteria: [
      {
        slug: "noise",
        name: "Noise",
        detail: "Rustle when walking, sitting, or using paper products nearby.",
      },
      {
        slug: "bulk",
        name: "Bulk / outline",
        detail: "Whether it shows under trousers, dresses, or leggings.",
      },
      {
        slug: "absorbency",
        name: "Absorbency",
        detail: "How long you can go without changing.",
      },
      {
        slug: "comfort",
        name: "Comfort",
        detail: "Waistband, wetness feel, and chafing.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "Monthly cost, not just pack price.",
      },
    ],
    products: [
      {
        productId: "prod-quiet-underwear",
        scores: { noise: 90, bulk: 72, absorbency: 70, comfort: 78, price: 60 },
        note: "Usually the quietest everyday option. Not the highest capacity.",
      },
      {
        productId: "prod-thin-liner",
        scores: { noise: 82, bulk: 88, absorbency: 42, comfort: 80, price: 78 },
        note: "Best under fitted clothes if your need is light.",
      },
      {
        productId: "prod-max-absorb",
        scores: { noise: 48, bulk: 40, absorbency: 94, comfort: 62, price: 55 },
        note: "Wins capacity. Often loses discretion.",
      },
    ],
    signals: [
      {
        rawQuote:
          "I don't care which brand is ‘best’. I care that nobody hears it when I sit down.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
      {
        rawQuote:
          "The plastic backing is what gives it away — it rustles under work trousers.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
  {
    id: "pain-thin",
    clusterId: "cl-discreet",
    slug: "thin-for-work",
    title: "Thin bladder protection for work",
    h1: "Thin bladder protection that does not show at work",
    problem:
      "Protection that works at home is visible under tailored trousers, pencil skirts, or leggings in an office.",
    analysis:
      "Outline is a geometry problem: pad width, rise, and how wet the product gets by mid-afternoon. Thin liners disappear until they fail. Underwear cuts hide better than rectangular pads. If you need all-day heavy absorbency, a thin product will lie to you.",
    whyNow:
      "Return-to-office and fitted workwear made ‘does it show’ a daily search, not a niche one.",
    strategy: "Build organic landing page",
    stage: 3,
    painScore: 86,
    intentScore: 84,
    competitionScore: 51,
    productGap: 68,
    affiliateScore: 76,
    organicScore: 83,
    opportunity: 81,
    trend: 22,
    sensitive: true,
    related: ["pain-quiet"],
    searchPhrases: [
      "thin bladder protection for work",
      "incontinence underwear under leggings",
      "adult diaper that doesn't show under clothes",
    ],
    youtubeQueries: ["discreet incontinence underwear work"],
    criteria: [
      {
        slug: "bulk",
        name: "Visibility",
        detail: "Line under fitted clothing.",
      },
      {
        slug: "noise",
        name: "Noise",
        detail: "Office chairs and quiet rooms expose rustle.",
      },
      {
        slug: "absorbency",
        name: "Absorbency",
        detail: "Enough for a meeting block.",
      },
      {
        slug: "comfort",
        name: "Comfort",
        detail: "Waistband under a tucked shirt.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "Daily cost at work, five days a week.",
      },
    ],
    products: [
      {
        productId: "prod-thin-liner",
        scores: { bulk: 90, noise: 80, absorbency: 40, comfort: 82, price: 80 },
        note: "Best outline. Change more often.",
      },
      {
        productId: "prod-quiet-underwear",
        scores: { bulk: 74, noise: 88, absorbency: 72, comfort: 76, price: 58 },
        note: "Better all-day office balance.",
      },
      {
        productId: "prod-max-absorb",
        scores: { bulk: 36, noise: 46, absorbency: 94, comfort: 60, price: 52 },
        note: "Too much outline for most fitted workwear.",
      },
    ],
    signals: [
      {
        rawQuote:
          "I need something that does not print through black trousers in an open office.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
  {
    id: "pain-sunscreen",
    clusterId: "cl-sunscreen",
    slug: "sting-eyes",
    title: "Sunscreen that does not sting eyes",
    h1: "Sunscreen that does not sting your eyes",
    problem:
      "Filters migrate with sweat and tears. Chemical UV filters and fragrance are the usual sting sources around the orbital bone.",
    analysis:
      "‘Best sunscreen’ lists ignore the eye. A sport chemical formula that wins sweat tests often loses the sting test. Fluid mineral formulas trade white cast and rub-in time for lower sting. If you wear makeup, the winner is the one that stays put, not the highest SPF number on the bottle.",
    whyNow:
      "Daily SPF advice plus outdoor commuting created a huge audience that will not tolerate sting.",
    strategy: "affiliate now",
    stage: 4,
    painScore: 88,
    intentScore: 86,
    competitionScore: 64,
    productGap: 55,
    affiliateScore: 82,
    organicScore: 80,
    opportunity: 79,
    trend: 22,
    sensitive: true,
    related: [],
    searchPhrases: [
      "sunscreen that doesn't sting eyes",
      "moisturiser that doesn't burn rosacea",
      "sunscreen sting around eyes",
    ],
    youtubeQueries: ["sunscreen stings eyes", "mineral sunscreen no sting"],
    criteria: [
      {
        slug: "sting",
        name: "Eye sting",
        detail: "Burn when you sweat or tear up.",
      },
      {
        slug: "wear",
        name: "Wear under makeup",
        detail: "Pilling and slip.",
      },
      {
        slug: "cast",
        name: "White cast",
        detail: "Visible film on deeper skin tones.",
      },
      {
        slug: "protection",
        name: "Stay-on protection",
        detail: "Does it still sit on the face after two hours outdoors.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "Daily face use adds up.",
      },
    ],
    products: [
      {
        productId: "prod-mineral-fluid",
        scores: { sting: 88, wear: 70, cast: 58, protection: 74, price: 60 },
        note: "Usually kinder around the eyes. Watch white cast.",
      },
      {
        productId: "prod-chemical-sport",
        scores: { sting: 38, wear: 64, cast: 86, protection: 90, price: 78 },
        note: "Stays on in sweat. More likely to migrate into eyes.",
      },
    ],
    signals: [
      {
        rawQuote:
          "Every ‘invisible’ SPF I try ends up burning the corners of my eyes by lunch.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
  {
    id: "pain-vacuum",
    clusterId: "cl-vacuum",
    slug: "dogs",
    title: "Vacuum that does not scare dogs",
    h1: "A vacuum that does not scare the dog",
    problem:
      "Dogs react to pitch, sudden start-up, and a human chasing a loud stick. Hair pickup is useless if you cannot run the machine.",
    analysis:
      "Quiet stick motors help. They do not fix the visual threat. Scheduled robots that run while the dog is walked remove the confrontation. If the dog fears any moving disc, you need a slower, quieter robot plus a routine, not a more powerful handheld.",
    whyNow:
      "Pet ownership and open-plan flats made ‘vacuum terror’ a weekly search, not a joke.",
    strategy: "affiliate now",
    stage: 3,
    painScore: 80,
    intentScore: 74,
    competitionScore: 48,
    productGap: 58,
    affiliateScore: 78,
    organicScore: 77,
    opportunity: 76,
    trend: 18,
    sensitive: false,
    related: [],
    searchPhrases: [
      "vacuum that doesn't scare dogs",
      "quiet vacuum for pets",
      "robot vacuum anxious dog",
    ],
    youtubeQueries: ["vacuum scares dog", "quiet vacuum pets"],
    criteria: [
      {
        slug: "noise",
        name: "Noise",
        detail: "Pitch and sudden volume.",
      },
      {
        slug: "motion",
        name: "Motion threat",
        detail: "A person swinging a stick vs a low disc.",
      },
      {
        slug: "pickup",
        name: "Hair pickup",
        detail: "Whether it actually clears the coat you live with.",
      },
      {
        slug: "schedule",
        name: "Can run without you",
        detail: "Clean while the dog is out.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "One machine vs two (quiet stick + robot).",
      },
    ],
    products: [
      {
        productId: "prod-quiet-stick",
        scores: { noise: 78, motion: 40, pickup: 82, schedule: 20, price: 70 },
        note: "Quieter, still a human with a wand.",
      },
      {
        productId: "prod-robot-sched",
        scores: { noise: 72, motion: 80, pickup: 68, schedule: 94, price: 48 },
        note: "Best if the trigger is you + the vacuum together.",
      },
    ],
    signals: [
      {
        rawQuote:
          "The vacuum works. I just cannot use it because the dog hides and shakes.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
  {
    id: "pain-bunion",
    clusterId: "cl-fit",
    slug: "bunions",
    title: "Shoes that do not rub bunions",
    h1: "Shoes that do not rub bunions",
    problem:
      "A tapered toe box and a seam over the joint turn every step into friction. Cushion under the heel does not fix that.",
    analysis:
      "This is a last-shape problem. Wide, foot-shaped toe boxes with stretch or few seams at the bunion beat ‘orthopaedic looking’ shoes that are still pointed. Standing-all-day cushion is a different pain — do not collapse them into one ‘comfort shoe’.",
    whyNow:
      "Office-to-trainers culture made people search specific joint pain, not generic ‘comfort shoes’.",
    strategy: "Build organic landing page",
    stage: 4,
    painScore: 85,
    intentScore: 83,
    competitionScore: 60,
    productGap: 57,
    affiliateScore: 81,
    organicScore: 78,
    opportunity: 77,
    trend: 15,
    sensitive: false,
    related: [],
    searchPhrases: [
      "shoes that don't rub bunions",
      "wide toe box shoes bunions",
      "trainers for bunion pain",
    ],
    youtubeQueries: ["shoes for bunions", "wide toe box review"],
    criteria: [
      {
        slug: "width",
        name: "Toe-box width",
        detail: "Room over the joint, not just a wide heel.",
      },
      {
        slug: "seam",
        name: "Seam placement",
        detail: "Stitching that sits on the bunion.",
      },
      {
        slug: "cushion",
        name: "Standing cushion",
        detail: "Helpful, but secondary to width.",
      },
      {
        slug: "look",
        name: "Looks wearable",
        detail: "Whether you will actually leave the house in them.",
      },
      {
        slug: "price",
        name: "Price",
        detail: "A pair you can wear four days a week.",
      },
    ],
    products: [
      {
        productId: "prod-wide-toe",
        scores: { width: 92, seam: 86, cushion: 64, look: 70, price: 58 },
        note: "Solves the joint first.",
      },
      {
        productId: "prod-cushion-trainer",
        scores: { width: 55, seam: 60, cushion: 90, look: 84, price: 62 },
        note: "Great for standing. Often still tapered at the toe.",
      },
    ],
    signals: [
      {
        rawQuote:
          "Wide fit still rubs because the seam sits right on the bunion.",
        sourceKind: "composite",
        sourceLabel: "Composite of repeated public review language",
      },
    ],
  },
];

export const RESERVED_PATHS = new Set([
  "login",
  "signup",
  "account",
  "admin",
  "watchlist",
  "billboard",
  "privacy",
  "market",
  "api",
  "product",
  "agent",
  "radar",
  "opportunities",
  "for-affiliates",
  "for-founders",
  "how-it-works",
  "pricing",
  "lab",
  "workspace",
  "test",
  "affiliate-opportunity-finder",
  "find-profitable-affiliate-niches",
  "find-underserved-markets",
  "product-validation",
  "reverse-product-research",
  "sitemap.xml",
  "robots.txt",
]);
