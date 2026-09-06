export const ALERT_KINDS = [
  "saved_destination",
  "saved_evidence",
  "saved_product",
  "saved_score",
  "ootd_affiliate",
  "ootd_founder",
] as const;

export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertPrefs = {
  emailSavedUpdates: boolean;
  emailOpportunity: boolean;
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
