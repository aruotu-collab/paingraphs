import type { ConsumerIntel, PainNarrative } from "./types";

export type NarrativeFacts = {
  id: string;
  h1: string;
  summary: string;
  explanation: string;
  whyNow: string | null;
  consumer: ConsumerIntel;
  productName?: string | null;
  productNote?: string | null;
};

const SEEDS: Record<string, PainNarrative> = {
  "pain-glasses": {
    hook: "You last about one album. Or one call. Then the arms of your glasses start walking, and the temple that was fine at 10:00 is the only thing you can feel at 10:40.",
    scene:
      "Over-ear cups trap spectacle arms against the skull. After 20–60 minutes the temple aches, the frames slip, or both. This used to be a long-flight complaint. Workdays with glasses on made it daily.",
    mechanism:
      "The pads are not the real problem. The headphones squeeze the arm of your glasses into the side of your head. Soft foam only delays the pinch. A tighter fit, thicker glasses, or a longer day makes it show up sooner.",
    failedLoop:
      "People loosen the headband, stretch it overnight, push the glasses up, switch to thinner frames for calls, or buy aftermarket pads. Then they give up on over-ears after an hour.",
    trap: "Your last pair failed because the pads were soft, but the headphones still squeezed your glasses. Paying more does not fix that.",
    turn: "The next choice is not better headphones. It is which tradeoff you can live with.",
  },
  "pain-quiet": {
    hook: "The leak is not the only fear. Plastic-backed products rustle when you walk, sit, or use a bathroom. Detection is the problem.",
    scene:
      "Search language has moved from a clinical category to discreet, quiet, and does not show. People are shopping the sound, not the absorbency chart.",
    mechanism:
      "Quietness is a materials problem: outer film versus cloth, pad wings versus shaped underwear, and how the product moves at the hip. Absorbency and silence trade off. A cloth-backed cut is usually quieter. A max-absorb guard is usually louder and more visible.",
    failedLoop:
      "People buy the pack that ranks first overall, then discover the film gives them away under work trousers.",
    trap: "The last pack rustled because the outside was plastic. A bigger size does not make it quieter.",
    turn: "Start with the quietest everyday cut, then decide if you can live with less capacity.",
  },
  "pain-thin": {
    hook: "Protection that works at home is visible under tailored trousers, a pencil skirt, or leggings in an office.",
    scene:
      "Return-to-office and fitted workwear made “does it show” a daily search. Outline shows up by mid-afternoon, not in the bathroom mirror at 7am.",
    mechanism:
      "Outline is geometry: pad width, rise, and how wet the product gets. Thin liners disappear until they fail. Underwear cuts hide better than rectangular pads. If you need all-day heavy absorbency, a thin product will lie to you.",
    failedLoop:
      "People size down for invisibility, then change twice before lunch, or size up and watch it print through the fabric.",
    trap: "Thin is not the same as all-day. If you need more protection, a skinny liner will fail before lunch.",
    turn: "Pick the thinnest cut that still matches how long you have to go.",
  },
  "pain-sunscreen": {
    hook: "Filters migrate with sweat and tears. By lunch the corners of your eyes are burning, and the bottle still says it is invisible.",
    scene:
      "Daily SPF advice plus outdoor commuting created a huge audience that will not tolerate sting. A sport formula that wins a sweat test often loses the eye test.",
    mechanism:
      "Chemical UV filters and fragrance are the usual sting sources around the orbital bone. Fluid mineral formulas trade white cast and rub-in time for lower sting. If you wear makeup, the winner is the one that stays put, not the highest SPF number.",
    failedLoop:
      "People rotate “invisible” SPFs, then stop using sunscreen around the eyes at all.",
    trap: "The last bottle stayed on in sweat, but it still ran into your eyes. Paying more for sport SPF does not fix that.",
    turn: "If sting is the complaint, start with a fluid mineral — and watch white cast.",
  },
  "pain-vacuum": {
    hook: "The vacuum works. You just cannot use it, because the dog hides and shakes.",
    scene:
      "Dogs react to pitch, sudden start-up, and a human chasing a loud stick. Pet ownership and open-plan flats made this a weekly search, not a joke. Hair pickup is useless if you cannot run the machine.",
    mechanism:
      "Quiet stick motors help. They do not fix the visual threat. A scheduled robot that runs while the dog is walked removes the confrontation. If the dog fears any moving disc, you need a slower, quieter robot plus a routine — not a more powerful handheld.",
    failedLoop:
      "People buy a quieter stick, then still cannot clean while the dog is in the room.",
    trap: "A quieter stick still looks like you chasing the dog. More suction does not fix fear.",
    turn: "If the panic starts when you pick the machine up, start with a robot you can run while the dog is out.",
  },
  "pain-bunion": {
    hook: "A tapered toe box and a seam over the joint turn every step into friction. Cushion under the heel does not fix that.",
    scene:
      "Office-to-trainers culture made people search this joint, not generic comfort shoes. Wide-fit still rubs when the seam sits on the bunion.",
    mechanism:
      "This is a last-shape problem. Wide, foot-shaped toe boxes with stretch or few seams at the joint beat orthopaedic-looking shoes that are still pointed. Standing-all-day cushion is a different pain.",
    failedLoop:
      "People buy extra cushion, then limp by afternoon because the toe is still tapered.",
    trap: "Extra cushion under the heel does not stop a seam sitting on the joint. Wide-fit still rubs if the toe is pointed.",
    turn: "Start with room over the joint. Cushion is secondary.",
  },
};

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}`;
}

function sentence(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

export function narrativeFromFacts(facts: NarrativeFacts): PainNarrative {
  const seed = SEEDS[facts.id];
  if (seed) return seed;

  const tried = facts.consumer.triedFirst.slice(0, 3);
  const fails = facts.consumer.usuallyFails[0] || facts.consumer.mistakes[0];
  const why = facts.consumer.whyItHappens || facts.explanation;
  const hook = [facts.summary, facts.whyNow].filter(Boolean).join(" ");
  const failedLoop = tried.length
    ? `People start with ${tried.join("; then ")}.`
    : "";
  const trap =
    fails ||
    "A generic best-of list ignores the job you actually have.";
  const turn = facts.productName
    ? `Start with ${facts.productName}${facts.productNote ? ` — ${facts.productNote}` : ""}.`
    : "The next choice is the tradeoff you can live with, not a generic winner.";

  return {
    hook: clip(sentence(hook), 420),
    scene: clip(sentence(facts.whyNow || facts.summary), 420),
    mechanism: clip(sentence(why), 520),
    failedLoop: failedLoop ? clip(sentence(failedLoop), 420) : "",
    trap: clip(sentence(trap), 360),
    turn: clip(sentence(turn), 280),
  };
}

export function sanitizeNarrative(
  raw: Partial<PainNarrative> | null | undefined,
  fallback: PainNarrative,
): PainNarrative {
  const banned =
    /\b(thousands|millions|#1 bestseller|everyone knows|studies show|hop.?link|amzn\.|amazon\.[a-z]+\/s\?)\b/i;
  const pick = (value: string | undefined, backup: string, max: number) => {
    const text = (value || "").replace(/\s+/g, " ").trim();
    if (text.length < 24 || banned.test(text)) return backup;
    return clip(text, max);
  };
  return {
    hook: pick(raw?.hook, fallback.hook, 420),
    scene: pick(raw?.scene, fallback.scene, 420),
    mechanism: pick(raw?.mechanism, fallback.mechanism, 520),
    failedLoop: pick(raw?.failedLoop, fallback.failedLoop, 420),
    trap: pick(raw?.trap, fallback.trap, 360),
    turn: pick(raw?.turn, fallback.turn, 280),
  };
}
