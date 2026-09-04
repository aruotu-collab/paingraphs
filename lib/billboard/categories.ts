import { CATEGORIES } from "@/lib/catalog/data";

const SLUGS = new Set(CATEGORIES.map((item) => item.slug));

export function billboardCategory(slug: string) {
  const match = CATEGORIES.find((item) => item.slug === slug);
  if (match) return match;
  return CATEGORIES[0];
}

export function normalizeCategorySlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (SLUGS.has(slug)) return slug;
  if (slug.includes("skin")) return "skincare";
  if (slug.includes("care") || slug.includes("health")) return "personal-care";
  if (slug.includes("home") || slug.includes("kitchen")) return "home";
  if (slug.includes("cloth") || slug.includes("apparel")) return "clothes";
  if (slug.includes("shoe") || slug.includes("footwear")) return "shoes";
  return "electronics";
}
