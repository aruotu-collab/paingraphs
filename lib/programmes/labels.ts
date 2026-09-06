import type { ProgrammeKind, ProgrammeStatus } from "@/lib/catalog/types";

const STATUS_LABELS: Record<ProgrammeStatus, string> = {
  confirmed: "Confirmed programme",
  likely: "Likely programme",
  merchant_needs_confirmation:
    "Merchant sells product; programme needs confirmation",
  sku_needs_confirmation: "Programme exists; exact SKU needs confirmation",
  none: "No programme found",
  manual_research: "Manual research needed",
};

const KIND_LABELS: Record<ProgrammeKind, string> = {
  brand: "Brand",
  retailer: "Retailer",
  network: "Network",
  merchant: "Merchant",
};

export function programmeStatusLabel(status: string) {
  return STATUS_LABELS[status as ProgrammeStatus] ?? status;
}

export function programmeKindLabel(kind: string) {
  return KIND_LABELS[kind as ProgrammeKind] ?? kind;
}
