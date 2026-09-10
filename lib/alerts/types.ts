export const ALERT_KINDS = [
  "saved_destination",
  "saved_evidence",
  "saved_product",
  "saved_score",
  "ootd_affiliate",
  "ootd_founder",
  "price_change",
  "saved_search",
] as const;

export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertPrefs = {
  emailSavedUpdates: boolean;
  emailOpportunity: boolean;
  emailPriceUpdates: boolean;
  emailSearchUpdates: boolean;
};

export function isSavedAlert(kind: string) {
  return (
    kind === "saved_destination" ||
    kind === "saved_evidence" ||
    kind === "saved_product" ||
    kind === "saved_score"
  );
}

export function isOpportunityAlert(kind: string) {
  return kind === "ootd_affiliate" || kind === "ootd_founder";
}

export function isPriceAlert(kind: string) {
  return kind === "price_change";
}

export function isSearchAlert(kind: string) {
  return kind === "saved_search";
}
