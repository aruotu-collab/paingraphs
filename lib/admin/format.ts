export function formatStamp(
  value: Date | string | number | null | undefined,
  mode: "date" | "datetime" = "datetime",
) {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const iso = date.toISOString();
  return mode === "date" ? iso.slice(0, 10) : iso.replace("T", " ").slice(0, 19);
}

export const emptyVisitStats = {
  all: 0,
  day: 0,
  week: 0,
  humans: 0,
  uniqueIpsWeek: 0,
  topPages: [] as { path: string; hits: number }[],
  topSources: [] as { source: string; hits: number }[],
  topIps: [] as {
    ip: string;
    country: string | null;
    hits: number;
    sources: string;
    primary: string;
  }[],
};
