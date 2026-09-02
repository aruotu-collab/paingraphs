import type { CampaignPack, PainHypothesisView, ProductDna } from "./types";

export function parseDna(raw: string): ProductDna {
  return JSON.parse(raw) as ProductDna;
}

export function parsePack(raw: string): CampaignPack {
  return JSON.parse(raw) as CampaignPack;
}

export function parseQuestions(raw: string) {
  return JSON.parse(raw) as PainHypothesisView["questions"];
}
