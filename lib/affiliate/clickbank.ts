const NICKNAME = process.env.CLICKBANK_NICKNAME ?? "paingraphs";

export function clickbankHop(vendor: string, tid?: string) {
  const url = new URL("https://hop.clickbank.net/");
  url.searchParams.set("affiliate", NICKNAME);
  url.searchParams.set("vendor", vendor.toLowerCase());
  if (tid) url.searchParams.set("tid", tid.slice(0, 24));
  return url.toString();
}

export function isAffiliateHref(value: string) {
  return /^https?:\/\//i.test(value);
}

export function productHref(searchQuery: string) {
  if (isAffiliateHref(searchQuery)) return searchQuery;
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(searchQuery)}`;
}

export function productCtaLabel(searchQuery: string) {
  if (/hop\.clickbank\.net/i.test(searchQuery)) {
    return "See this ClickBank option";
  }
  if (isAffiliateHref(searchQuery)) return "See this option";
  return "Search current options";
}

export const CLICKBANK_PAINS = [
  {
    categoryId: "cat-personal-care",
    vendor: "audifort",
    quoteQuery:
      "can't hear conversation in noisy restaurant speech in noise missing dialogue",
    clusterSlug: "hearing",
    clusterName: "Hearing",
    clusterSummary: "Missing speech in noise and daily ear strain.",
    slug: "hearing-in-noise",
    title: "Hearing that still works in noisy rooms",
    h1: "When conversation disappears in restaurants",
    problem:
      "In a restaurant, a group, or under a TV, speech turns into mush. People lean in, ask others to repeat, or stop going out.",
    analysis:
      "The useful split is not a miracle drop. It is environment, amplification, and whether a hearing test is overdue. OTC amplifiers help some people and fatigue others. Fitted hearing aids cost more and need setup. A supplement is an extra to compare, not a first step.",
    whyNow:
      "Noisy dining and open-plan talk are normal, and cheap amplifiers are easy to buy before anyone books a test.",
    offerName: "Hearing-support supplement",
    offerSummary:
      "A ClickBank dietary supplement sold for ear wellness. It is not a hearing aid and not a diagnosis.",
    whoFor:
      "Best if you want to compare a supplement after checking environment, amplification, and a hearing test.",
    priceBand: "supplement",
    note: "Affiliate option. Compare against amplifiers, hearing aids, and a clinician. This is not the answer.",
    criteria: [
      {
        slug: "speech",
        name: "Speech in noise",
        detail: "Whether you can follow one voice when the room is loud.",
      },
      {
        slug: "comfort",
        name: "All-day comfort",
        detail: "Strain, feedback, and whether you will actually wear it.",
      },
      {
        slug: "cost",
        name: "Cost to try",
        detail: "What you spend before you know if it helps.",
      },
      {
        slug: "next-step",
        name: "Honest next step",
        detail: "Test and fitting versus another bottle or gadget.",
      },
    ],
    products: [
      {
        slug: "hearing-test",
        name: "Hearing test first",
        summary: "A clinician or audiologist measures what is actually failing.",
        whoFor: "Best if this has lasted weeks or you miss speech at home too.",
        searchQuery: "hearing test near me",
        priceBand: "varies",
        note: "Slowest path. Highest signal. Not a product to add to cart.",
        scores: { speech: 92, comfort: 80, cost: 55, "next-step": 96 },
      },
      {
        slug: "otc-amplifier",
        name: "OTC personal amplifier",
        summary: "A wearable that boosts nearby speech. Can hiss or fatigue you.",
        whoFor: "Best if restaurants are the main problem and you want a reversible trial.",
        searchQuery: "OTC hearing amplifier speech in noise",
        priceBand: "£30–£280",
        note: "Helps some rooms. Does not replace a test if loss is real.",
        scores: { speech: 78, comfort: 62, cost: 74, "next-step": 58 },
      },
      {
        slug: "fitted-aid",
        name: "Fitted hearing aid",
        summary: "Programmed for your loss. Better in noise when done well. Costs more.",
        whoFor: "Best if a test already showed loss and you will wear it daily.",
        searchQuery: "hearing aids for restaurants speech in noise",
        priceBand: "£800+",
        note: "Highest capability. Fitting quality matters more than the brand name.",
        scores: { speech: 88, comfort: 70, cost: 28, "next-step": 84 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "jointgen",
    quoteQuery:
      "knees hurt after sitting stairs stiff getting out of chair",
    clusterSlug: "joints",
    clusterName: "Joints",
    clusterSummary: "Stiffness after sitting and pain on stairs.",
    slug: "knees-after-sitting",
    title: "Knees that do not seize after sitting",
    h1: "When standing up from a chair hurts",
    problem:
      "After a desk, a car, or a sofa, the first steps sting. Stairs and getting out of a chair become the moments people plan around.",
    analysis:
      "The useful split is load, strength, and whether swelling or locking needs a clinician. Braces and shoes change the next hour. Strength work changes the next months. A supplement is optional and unproven for most people — not the default.",
    whyNow:
      "Desk days plus weekend stairs make this a daily complaint, and joint bottles are easy to click before anyone tries a simpler change.",
    offerName: "Joint-support supplement",
    offerSummary:
      "A ClickBank joint-health supplement. It is not a replacement for physiotherapy or a clinician.",
    whoFor:
      "Best if you want to compare a supplement after movement, load, and professional advice.",
    priceBand: "supplement",
    note: "Affiliate option. Compare against strength work, braces, and a clinician. This is not the answer.",
    criteria: [
      {
        slug: "first-steps",
        name: "First steps",
        detail: "Pain when you stand up or start walking after sitting.",
      },
      {
        slug: "stairs",
        name: "Stairs and chairs",
        detail: "Whether down-stairs and sit-to-stand stay possible.",
      },
      {
        slug: "daily-use",
        name: "You will do it",
        detail: "A plan you can keep on a work day, not a 12-week fantasy.",
      },
      {
        slug: "red-flag",
        name: "When to get checked",
        detail: "Locking, swelling, or night pain needs a person, not a cart.",
      },
    ],
    products: [
      {
        slug: "strength-physio",
        name: "Strength and physio",
        summary: "Quad and hip work, plus a physio if stairs keep winning.",
        whoFor: "Best if pain is stiff-then-eases and you can do 10 minutes a day.",
        searchQuery: "knee strengthening after sitting stiffness",
        priceBand: "£0–£80",
        note: "Slow. Highest odds if there is no locking or hot swelling.",
        scores: { "first-steps": 86, stairs: 84, "daily-use": 60, "red-flag": 88 },
      },
      {
        slug: "brace-shoe",
        name: "Brace or rocker shoe",
        summary: "Offloads the joint for a walk or a shift. Does not fix the cause.",
        whoFor: "Best if one day — travel, stairs, a standing shift — is the problem.",
        searchQuery: "knee brace stairs sitting stiffness",
        priceBand: "£15–£120",
        note: "Useful for hours. Easy to lean on instead of getting stronger.",
        scores: { "first-steps": 70, stairs: 72, "daily-use": 78, "red-flag": 50 },
      },
      {
        slug: "clinician",
        name: "Clinician visit",
        summary: "Rules out injury, inflammatory disease, or a knee that needs imaging.",
        whoFor: "Best if it locks, swells, or woke you last week.",
        searchQuery: "GP physiotherapist knee pain after sitting",
        priceBand: "varies",
        note: "Right first move when red flags are present.",
        scores: { "first-steps": 80, stairs: 80, "daily-use": 55, "red-flag": 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "prodentim",
    quoteQuery:
      "gums bleed when brushing mouthwash does not fix bad breath",
    clusterSlug: "oral-care",
    clusterName: "Oral care",
    clusterSummary: "Bleeding gums and breath that mouthwash does not fix.",
    slug: "gums-bleed-breath",
    title: "Gums that do not bleed when you brush",
    h1: "When mouthwash cannot fix the breath",
    problem:
      "Brushing leaves pink in the sink. Mints and mouthwash mask breath for an hour, then it returns. People hide talking at close range.",
    analysis:
      "Bleeding is a hygiene and gum-health signal, not a flavour problem. Floss or interdental brushes reach what rinse cannot. A hygienist visit is the honest reset. A probiotic candy is a maybe, not a substitute for a dentist.",
    whyNow:
      "Mouthwash aisles and oral-probiotic ads are loud, and bleeding gums are easy to treat as a shopping problem.",
    offerName: "Oral probiotic candy",
    offerSummary:
      "A ClickBank chewable oral-microbiome supplement. It is not a substitute for a dentist.",
    whoFor:
      "Best if you want to compare a probiotic candy after floss, a clean, and a dental visit.",
    priceBand: "supplement",
    note: "Affiliate option. Bleeding gums need a dentist. This is not the answer.",
    criteria: [
      {
        slug: "bleeding",
        name: "Bleeding stops",
        detail: "Whether gums stay calm after a week of real cleaning.",
      },
      {
        slug: "breath",
        name: "Breath that lasts",
        detail: "Hours later, not the first mint after lunch.",
      },
      {
        slug: "access",
        name: "Gets between teeth",
        detail: "Rinse does not replace floss or a brush that fits the gap.",
      },
      {
        slug: "dentist",
        name: "Dentist when needed",
        detail: "Pain, loose teeth, or bleeding that will not quit.",
      },
    ],
    products: [
      {
        slug: "interdental",
        name: "Interdental clean",
        summary: "Floss or small brushes that actually reach the bleed line.",
        whoFor: "Best if bleeding is new and you have not cleaned between teeth daily.",
        searchQuery: "interdental brushes bleeding gums",
        priceBand: "£3–£15",
        note: "Unsexy. Usually the missing step before any bottle.",
        scores: { bleeding: 88, breath: 76, access: 94, dentist: 70 },
      },
      {
        slug: "hygienist",
        name: "Hygienist and dentist",
        summary: "Removes what home tools cannot and checks for gum disease.",
        whoFor: "Best if this has lasted months or teeth feel loose.",
        searchQuery: "dental hygienist bleeding gums",
        priceBand: "£40–£120",
        note: "Right reset. Not optional if bleeding is routine.",
        scores: { bleeding: 92, breath: 84, access: 80, dentist: 96 },
      },
      {
        slug: "mouthwash",
        name: "Mouthwash and mints",
        summary: "Masks smell. Does not treat the gum line.",
        whoFor: "Best as a short social cover, not as the plan.",
        searchQuery: "mouthwash bad breath bleeding gums",
        priceBand: "£2–£8",
        note: "Useful for an hour. Easy to mistake for treatment.",
        scores: { bleeding: 28, breath: 48, access: 20, dentist: 22 },
      },
    ],
  },
  {
    categoryId: "cat-skincare",
    vendor: "primebiome",
    requiresApproval: true,
    quoteQuery:
      "skin still itchy after moisturiser cream does not help flaky irritated",
    clusterSlug: "skin-barrier",
    clusterName: "Skin barrier",
    clusterSummary: "Itch and flakes that topical cream does not settle.",
    slug: "skin-cream-fails",
    title: "Skin that stays calm when cream fails",
    h1: "When every cream still leaves you itchy",
    problem:
      "Fragrance-free tubs, steroids, and 'repair' serums rotate. The itch or flake comes back, and people start reading gut-skin claims.",
    analysis:
      "Most of this is barrier, trigger, and time — not a missing gummy. Simple bland moisturiser plus stopping the irritant beats a stack. A dermatologist is the move if it cracks, weeps, or keeps you awake. A probiotic is optional and slow to judge.",
    whyNow:
      "Gut-skin ads are everywhere, and irritated skin is easy to turn into a subscription.",
    offerName: "Gut-skin probiotic gummy",
    offerSummary:
      "A ClickBank probiotic gummy sold for gut and skin appearance. It is not a prescription and not a diagnosis.",
    whoFor:
      "Best if you want to compare a supplement after barrier repair, triggers, and a clinician if needed.",
    priceBand: "supplement",
    note: "Affiliate option. Compare against fragrance-free barrier care and a dermatologist. This is not the answer.",
    criteria: [
      {
        slug: "itch",
        name: "Itch calms",
        detail: "Whether you stop thinking about your skin by evening.",
      },
      {
        slug: "barrier",
        name: "Barrier repair",
        detail: "Fewer flakes and less sting from water or weather.",
      },
      {
        slug: "triggers",
        name: "Trigger control",
        detail: "Fragrance, over-exfoliation, and fabrics you can actually drop.",
      },
      {
        slug: "clinic",
        name: "Clinic when needed",
        detail: "Cracking, infection signs, or sleep lost to itch.",
      },
    ],
    products: [
      {
        slug: "bland-barrier",
        name: "Bland barrier cream",
        summary: "Fragrance-free, short ingredient list, used after every wash.",
        whoFor: "Best if you have been stacking actives and the skin is angry.",
        searchQuery: "fragrance free barrier cream itchy flaky skin",
        priceBand: "£6–£25",
        note: "First move for most people. Boring on purpose.",
        scores: { itch: 78, barrier: 90, triggers: 70, clinic: 60 },
      },
      {
        slug: "trigger-strip",
        name: "Trigger strip-back",
        summary: "Stop acids, perfume, and hot showers for two weeks.",
        whoFor: "Best if a new product or scent started this.",
        searchQuery: "stop irritating skincare barrier repair",
        priceBand: "£0",
        note: "Free. Hard to stick to. Often the real fix.",
        scores: { itch: 80, barrier: 84, triggers: 94, clinic: 58 },
      },
      {
        slug: "dermatologist",
        name: "Dermatologist or GP",
        summary: "Rules out eczema, infection, or something cream will not touch.",
        whoFor: "Best if it weeps, spreads, or keeps you awake.",
        searchQuery: "dermatologist itchy flaky skin cream not working",
        priceBand: "varies",
        note: "Right when home repair fails or skin breaks.",
        scores: { itch: 86, barrier: 80, triggers: 72, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "yusleep",
    requiresApproval: true,
    quoteQuery:
      "can't stay asleep wake in the middle of the night insomnia 3am tossing turning",
    clusterSlug: "sleep",
    clusterName: "Sleep",
    clusterSummary: "Waking in the night and a house that cannot stay quiet.",
    slug: "sleep-will-not-stay",
    title: "Sleep that stays through the night",
    h1: "When you are awake again at 3am",
    problem:
      "Falling asleep is not the problem. You wake at 2 or 3, or a partner's snoring keeps the other person on the sofa. The next workday is already lost.",
    analysis:
      "The useful split is timing, a bed that does not fight you, and whether this needs a clinician. Screens, alcohol, and a collapsing mattress explain a lot of 3am wakes. A sleep supplement is optional and easy to mistake for the whole plan.",
    whyNow:
      "Sleep bottles and mattress funnels are loud, and a bad night is easy to treat as a checkout problem.",
    offerName: "Sleep-support supplement",
    offerSummary:
      "A ClickBank sleep supplement. It is not a diagnosis and not a substitute for a clinician if this has lasted months.",
    whoFor:
      "Best if you want to compare a supplement after timing, a better bed, and a check if it is more than a bad week.",
    priceBand: "supplement",
    note: "Affiliate option. Compare against sleep timing, a mattress, and a clinician. This is not the answer.",
    criteria: [
      {
        slug: "stay-asleep",
        name: "Stay asleep",
        detail: "Whether you still wake at 3am after a week, not one lucky night.",
      },
      {
        slug: "next-day",
        name: "Next-day function",
        detail: "Whether work and driving feel safe, not just groggy.",
      },
      {
        slug: "partner",
        name: "House stays quiet",
        detail: "Snoring and a mattress that dumps one of you onto the sofa.",
      },
      {
        slug: "clinic",
        name: "When to get checked",
        detail: "Apnoea signs, depression, or months of this need a person.",
      },
    ],
    products: [
      {
        slug: "timing",
        name: "Sleep timing first",
        summary: "Fixed wake time, less late alcohol, screens off. Free and hard.",
        whoFor: "Best if this started with late nights or a new job, not gasping.",
        searchQuery: "sleep hygiene wake at 3am stay asleep",
        priceBand: "£0",
        note: "First move for most people. Boring on purpose.",
        scores: { "stay-asleep": 78, "next-day": 74, partner: 40, clinic: 62 },
      },
      {
        slug: "mattress",
        name: "Mattress or pillow that holds you",
        summary: "Support and less roll-together. Does not fix apnoea.",
        whoFor: "Best if your back or a sinking mattress is the 3am trigger.",
        searchQuery: "mattress for side sleeper partner snoring wake at night",
        priceBand: "£150–£900",
        note: "Useful. Easy to buy instead of changing the evening.",
        scores: { "stay-asleep": 70, "next-day": 68, partner: 82, clinic: 45 },
      },
      {
        slug: "clinician",
        name: "GP or sleep clinic",
        summary: "Rules out apnoea, restless legs, or something a bottle will not touch.",
        whoFor: "Best if you gasp, snore loudly, or this has lasted months.",
        searchQuery: "GP sleep clinic wake at 3am snoring apnoea",
        priceBand: "varies",
        note: "Right when red flags are present.",
        scores: { "stay-asleep": 88, "next-day": 86, partner: 70, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "femicore",
    requiresApproval: true,
    quoteQuery:
      "leak when I sneeze cough laugh pelvic floor bladder leak not pads",
    clusterSlug: "sneeze-leak",
    clusterName: "Sneeze leak",
    clusterSummary: "Leak on sneeze or cough, separate from pad rustle and bulk.",
    slug: "leak-when-sneezing",
    title: "Protection that holds when you sneeze",
    h1: "When a sneeze is enough to leak",
    problem:
      "A cough, a laugh, or a sneeze leaves a spot. People plan outfits around it and skip trampolines and running. This is not the rustle or bulk of a pad — it is the leak itself.",
    analysis:
      "The useful split is pelvic-floor strength, a clinician if it is new or worsening, and whether a pad is only covering the symptom. A supplement is optional. Do not treat this as a quieter nappy problem.",
    whyNow:
      "Pelvic-floor bottles are easy to click, and sneeze-leak is easy to hide as a shopping problem.",
    offerName: "Pelvic-floor supplement",
    offerSummary:
      "A ClickBank formula sold for bladder support. It is not physio and not a diagnosis.",
    whoFor:
      "Best if you want to compare a supplement after pelvic-floor work and a clinician if this is new.",
    priceBand: "supplement",
    note: "Affiliate option. Compare against physio, a clinician, and a pad as cover — not as the plan. This is not the answer.",
    criteria: [
      {
        slug: "hold",
        name: "Holds on sneeze",
        detail: "Cough, laugh, and sneeze without a spot.",
      },
      {
        slug: "training",
        name: "You will train",
        detail: "A pelvic-floor plan you can keep, not a one-week app.",
      },
      {
        slug: "cover",
        name: "Cover vs fix",
        detail: "Whether a liner is a backup or the whole strategy.",
      },
      {
        slug: "clinic",
        name: "When to get checked",
        detail: "New, worsening, pain, or blood needs a person.",
      },
    ],
    products: [
      {
        slug: "physio",
        name: "Pelvic-floor physio",
        summary: "Taught squeezes beat guessing. Slow. Highest odds if this is stress leak.",
        whoFor: "Best if leak is on sneeze or jump and you can do daily work.",
        searchQuery: "pelvic floor physiotherapy leak when sneezing",
        priceBand: "£40–£90",
        note: "Unsexy. Usually the missing step before any bottle.",
        scores: { hold: 88, training: 70, cover: 80, clinic: 78 },
      },
      {
        slug: "clinician",
        name: "GP or continence clinic",
        summary: "Rules out infection, prolapse, or something exercises will not touch.",
        whoFor: "Best if this is new, painful, or getting worse.",
        searchQuery: "GP continence clinic leak when sneezing",
        priceBand: "varies",
        note: "Right first move when red flags are present.",
        scores: { hold: 82, training: 55, cover: 70, clinic: 96 },
      },
      {
        slug: "liner-backup",
        name: "Thin liner as backup",
        summary: "Covers a spot while you train. Does not train the floor.",
        whoFor: "Best as cover on a bad week, not as the only plan.",
        searchQuery: "thin bladder liner sneeze leak",
        priceBand: "£4–£12",
        note: "Useful cover. Easy to stop there. Not the quiet-underwear page.",
        scores: { hold: 48, training: 22, cover: 86, clinic: 40 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "none",
    skipHop: true,
    quoteQuery:
      "lower back pain worse after sitting desk sitting hurts more than walking",
    clusterSlug: "desk-back",
    clusterName: "Desk back",
    clusterSummary: "Lower back that seizes after sitting, not from a heavy lift.",
    slug: "back-after-sitting",
    title: "Back that does not seize after sitting",
    h1: "When sitting hurts more than moving",
    problem:
      "After a desk day or a long drive, the lower back tightens the moment you stop. Walking can feel fine. Sitting is the flare. People stand in meetings and plan car trips around the first steps out of the seat.",
    analysis:
      "The useful split is time spent flexed, whether movement actually helps, and red flags that need a person. Walking, sit-stand, and a physio plan beat a joint bottle aimed at knees. A mobility supplement is the wrong object if the complaint is sitting, not stairs. Get checked if pain shoots down a leg, you lose strength, or bladder or bowel changes.",
    whyNow:
      "Desk days are long, and sitting-pain is easy to treat as a checkout problem instead of a load problem.",
    offerName: "Unused",
    offerSummary: "No ClickBank hop. Sitting-back is not a knee-supplement page.",
    whoFor: "Unused",
    priceBand: "n/a",
    note: "No affiliate hop.",
    fallbackQuotes: [
      {
        quote:
          "Anyone else's back pain get worse from sitting than actual movement? The worst flare ups happen after long car rides or working at my desk too long.",
        title: "Anyone else's back pain get worse from sitting than actual movement??",
        url: "https://www.reddit.com/r/backpain/comments/1tgonb4/anyone_elses_back_pain_get_worse_from_sitting/",
      },
      {
        quote:
          "After a year of dealing with L4-L5 disc issues I have basically become obsessed with figuring out what desk workers need to do differently.",
        title: "Everything I changed as a desk worker with back pain",
        url: "https://www.reddit.com/r/backpain/comments/1sle3lw/everything_i_changed_as_a_desk_worker_with_back/",
      },
      {
        quote:
          "It made me realize that all I was doing differently was walking like 6+ miles a day, and not sitting at my gaming PC at all.",
        title: "My personal guide that fixed me 9/10 upper back pain that lasted 2 years",
        url: "https://www.reddit.com/r/backpain/comments/1u62qec/my_personal_guide_that_fixed_me_910_upper_back/",
      },
    ],
    criteria: [
      {
        slug: "after-sit",
        name: "After sitting",
        detail: "Whether the first minutes standing or walking stay possible.",
      },
      {
        slug: "desk-day",
        name: "A real desk day",
        detail: "A change you can keep at work, not a weekend-only routine.",
      },
      {
        slug: "movement",
        name: "Movement helps",
        detail: "Whether walking or standing eases it more than another chair.",
      },
      {
        slug: "red-flag",
        name: "When to get checked",
        detail: "Leg weakness, night pain, or bladder change needs a person.",
      },
    ],
    products: [
      {
        slug: "break-sit",
        name: "Break the sit",
        summary: "Walk, stand, and timer breaks. Often the missing load change.",
        whoFor: "Best if sitting is worse than moving and you can stand sometimes.",
        searchQuery: "walking breaks sit stand lower back pain after sitting",
        priceBand: "£0–£400",
        note: "First move for most desk flares. A desk is optional. Walking is not.",
        scores: { "after-sit": 84, "desk-day": 70, movement: 90, "red-flag": 55 },
      },
      {
        slug: "physio",
        name: "Physio for desk back",
        summary: "Taught hip and back work beats guessing from a viral routine.",
        whoFor: "Best if this has lasted months and walking only helps for an hour.",
        searchQuery: "physiotherapy lower back pain worse after sitting",
        priceBand: "£40–£90",
        note: "Slow. Highest odds if there are no red flags.",
        scores: { "after-sit": 86, "desk-day": 62, movement: 82, "red-flag": 78 },
      },
      {
        slug: "clinician",
        name: "GP or back clinic",
        summary: "Rules out nerve compression or something a chair will not touch.",
        whoFor: "Best if pain shoots down a leg, you lose power, or this is new and severe.",
        searchQuery: "GP sciatica red flags back pain after sitting",
        priceBand: "varies",
        note: "Right first move when red flags are present.",
        scores: { "after-sit": 80, "desk-day": 50, movement: 70, "red-flag": 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    vendor: "kerassent",
    requiresApproval: true,
    quoteQuery:
      "toenail fungus cream doesn't work thick yellow toenail years",
    clusterSlug: "toenails",
    clusterName: "Toenails",
    clusterSummary: "Thick, yellow nails that cream does not clear.",
    slug: "thick-toenails",
    title: "Toenails that do not stay thick and ugly",
    h1: "When the cream never clears the nail",
    problem:
      "The nail is thick, yellow, or crumbling. Creams and paints cycle for years. People hide sandals, and a clinician sometimes says live with it until it hurts at work.",
    analysis:
      "The useful split is whether the nail bed is still reachable, whether a clinician should confirm fungus, and how often paint fails once the nail is a slab. Urea and debridement thin what a bottle cannot reach. Oral treatment is a medical decision. A ClickBank oil is optional and slow to judge — not the first step after a decade of cream.",
    whyNow:
      "Nail oils are easy to click, and a thick toenail is easy to hide as a shopping problem.",
    offerName: "Toenail fungus oil",
    offerSummary:
      "A ClickBank topical sold for nail appearance. It is not a diagnosis and not oral antifungal treatment.",
    whoFor:
      "Best if you want to compare an oil after thinning, a clinician, and honest odds on paint.",
    priceBand: "supplement",
    note: "Affiliate option once whitelisted. Compare against urea, podiatry, and a clinician. This is not the answer.",
    fallbackQuotes: [
      {
        quote:
          "If you’re reading this, you’re most likely feeling the same frustration and embarrassment I have felt for over 10 years suffering from toenail fungus.",
        title: "I cured my toenail fungus without medication, this is how:",
        url: "https://www.reddit.com/r/NailFungus/comments/1vmzzu2/i_cured_my_toenail_fungus_without_medication_this/",
      },
      {
        quote:
          "Long story short my doc told me to not worry about my big toe and there was really nothing to be done for it and to just let it be. Now for the past month it's been very problematic.",
        title: "Seeking advice for a bad toe that has gotten worse over 6-7yrs",
        url: "https://www.reddit.com/r/NailFungus/comments/1w3ip7r/seeking_advice_for_a_bad_toe_that_has_gotten/",
      },
      {
        quote:
          "Over 20 years ago, I damaged a nail. About 15 years ago, that damage turned into nail fungus that slowly spread. For years, I tried everything, topical",
        title: "Getting somewhere after 15+ years",
        url: "https://www.reddit.com/r/NailFungus/comments/1nmtb71/getting_somewhere_after_15_years/",
      },
    ],
    criteria: [
      {
        slug: "clears",
        name: "Nail actually changes",
        detail: "New growth looks normal, not another six months of yellow slab.",
      },
      {
        slug: "reach",
        name: "Reaches the bed",
        detail: "Whether the treatment gets under a thick nail, not just the surface.",
      },
      {
        slug: "daily",
        name: "You will keep it up",
        detail: "Months of care, not a one-week paint that flakes off.",
      },
      {
        slug: "clinic",
        name: "When to get checked",
        detail: "Pain, spreading skin infection, or diabetes needs a person.",
      },
    ],
    products: [
      {
        slug: "urea-thin",
        name: "Urea and thinning",
        summary: "Softens and files the slab so anything else can reach the bed.",
        whoFor: "Best if the nail is thick and paint has been sitting on top for years.",
        searchQuery: "urea cream thick toenail fungus debridement",
        priceBand: "£8–£25",
        note: "Unsexy. Usually the missing step before any oil.",
        scores: { clears: 70, reach: 88, daily: 64, clinic: 58 },
      },
      {
        slug: "podiatry",
        name: "Podiatry or GP",
        summary: "Confirms fungus, cuts what you cannot, and discusses oral treatment.",
        whoFor: "Best if this has lasted years, hurts at work, or you have diabetes.",
        searchQuery: "podiatrist thick toenail fungus GP",
        priceBand: "varies",
        note: "Right reset. Oral drugs are a medical decision, not a cart add-on.",
        scores: { clears: 86, reach: 84, daily: 55, clinic: 96 },
      },
      {
        slug: "otc-paint",
        name: "OTC antifungal paint",
        summary: "Cheap and visible. Often fails once the nail is a slab.",
        whoFor: "Best if the nail is still thin and this just started.",
        searchQuery: "toenail fungus paint cream thick nail",
        priceBand: "£6–£20",
        note: "Useful early. Easy to keep buying after it has already failed.",
        scores: { clears: 38, reach: 32, daily: 72, clinic: 30 },
      },
    ],
  },
] as const;
