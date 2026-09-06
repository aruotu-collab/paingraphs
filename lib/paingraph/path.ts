export function painHref(
  categorySlug: string,
  clusterSlug: string,
  painSlug: string,
) {
  return `/${categorySlug}/${clusterSlug}/${painSlug}`;
}

export const RESERVED_APP_PATHS = [
  "login",
  "signup",
  "home",
  "admin",
  "marketing-agent",
  "forbidden",
  "affiliates",
  "founders",
  "top-pains",
  "privacy",
  "pricing",
  "api",
  "go",
] as const;
