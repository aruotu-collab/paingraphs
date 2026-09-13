import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import {
  affiliateDestinations,
  affiliateProgrammes,
  destinationClicks,
  destinationConversions,
  pains,
  products,
} from "@/lib/db/schema";
import { countryLabel } from "@/lib/destinations/url";
import { ensureConversionTable } from "@/lib/destinations/store";
import { ensureIdentityTables } from "@/lib/identity/db";
import { allowedJoinUrl } from "@/lib/programmes/catalog";
import { effectiveProgrammeStatus } from "@/lib/programmes/store";

export type ProviderDestinationRow = {
  id: string;
  painId: string;
  painTitle: string;
  productName: string;
  country: string;
  countryLabel: string;
  clicks: number;
  revenue: number;
  conversions: number;
  lastClickAt: Date | null;
};

export type ProviderHostRow = {
  host: string;
  destinations: number;
  pains: number;
  clicks: number;
  revenue: number;
  conversions: number;
  lastClickAt: Date | null;
  rows: ProviderDestinationRow[];
};

export type ProviderProgrammeRow = {
  name: string;
  kind: string;
  joinUrl: string | null;
  products: number;
  confirmed: number;
  pending: number;
};

function hostFromUrl(url: string) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function asDate(value: Date | number | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listProviderHosts(): Promise<ProviderHostRow[]> {
  await ensureIdentityTables();
  await ensureConversionTable();
  const [destinations, clicks, conversions, painRows, productRows] =
    await Promise.all([
      db.select().from(affiliateDestinations),
      db.select().from(destinationClicks),
      db.select().from(destinationConversions),
      db.select({ id: pains.id, title: pains.title }).from(pains),
      db.select({ id: products.id, name: products.name }).from(products),
    ]);
  const painTitle = new Map(painRows.map((row) => [row.id, row.title]));
  const productName = new Map(productRows.map((row) => [row.id, row.name]));
  const clicksByDest = new Map<string, { count: number; last: Date | null }>();
  for (const row of clicks) {
    const current = clicksByDest.get(row.destinationId) ?? {
      count: 0,
      last: null,
    };
    current.count += 1;
    const created = asDate(row.createdAt);
    if (created && (!current.last || created > current.last)) {
      current.last = created;
    }
    clicksByDest.set(row.destinationId, current);
  }
  const moneyByDest = new Map<string, { amount: number; count: number }>();
  for (const row of conversions) {
    if (!row.destinationId) continue;
    const current = moneyByDest.get(row.destinationId) ?? {
      amount: 0,
      count: 0,
    };
    current.amount += row.amount;
    current.count += 1;
    moneyByDest.set(row.destinationId, current);
  }

  const groups = new Map<string, ProviderHostRow>();
  for (const dest of destinations) {
    const host = hostFromUrl(dest.url);
    if (!host) continue;
    const click = clicksByDest.get(dest.id);
    const money = moneyByDest.get(dest.id);
    const row: ProviderDestinationRow = {
      id: dest.id,
      painId: dest.painId,
      painTitle: painTitle.get(dest.painId) ?? dest.painId,
      productName: productName.get(dest.productId) ?? dest.productId,
      country: dest.country,
      countryLabel: countryLabel(dest.country),
      clicks: click?.count ?? 0,
      revenue: money?.amount ?? 0,
      conversions: money?.count ?? 0,
      lastClickAt: click?.last ?? null,
    };
    const group = groups.get(host) ?? {
      host,
      destinations: 0,
      pains: 0,
      clicks: 0,
      revenue: 0,
      conversions: 0,
      lastClickAt: null,
      rows: [],
    };
    group.destinations += 1;
    group.clicks += row.clicks;
    group.revenue += row.revenue;
    group.conversions += row.conversions;
    if (row.lastClickAt && (!group.lastClickAt || row.lastClickAt > group.lastClickAt)) {
      group.lastClickAt = row.lastClickAt;
    }
    group.rows.push(row);
    groups.set(host, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      pains: new Set(group.rows.map((row) => row.painId)).size,
      rows: group.rows.sort(
        (a, b) => b.clicks - a.clicks || a.painTitle.localeCompare(b.painTitle),
      ),
    }))
    .sort((a, b) => b.clicks - a.clicks || a.host.localeCompare(b.host));
}

export async function listProviderProgrammes(): Promise<ProviderProgrammeRow[]> {
  await ensureCatalog();
  const rows = await db.select().from(affiliateProgrammes);
  const groups = new Map<
    string,
    {
      name: string;
      kind: string;
      joinUrl: string | null;
      products: Set<string>;
      confirmed: number;
      pending: number;
    }
  >();
  for (const row of rows) {
    const group = groups.get(row.name) ?? {
      name: row.name,
      kind: row.kind,
      joinUrl: allowedJoinUrl(row.joinUrl),
      products: new Set<string>(),
      confirmed: 0,
      pending: 0,
    };
    group.products.add(row.productId);
    if (effectiveProgrammeStatus(row) === "confirmed") group.confirmed += 1;
    else group.pending += 1;
    if (!group.joinUrl) group.joinUrl = allowedJoinUrl(row.joinUrl);
    groups.set(row.name, group);
  }
  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      kind: group.kind,
      joinUrl: group.joinUrl,
      products: group.products.size,
      confirmed: group.confirmed,
      pending: group.pending,
    }))
    .sort((a, b) => b.confirmed - a.confirmed || a.name.localeCompare(b.name));
}
