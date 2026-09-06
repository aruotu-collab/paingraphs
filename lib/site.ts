export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://paingraphs.com";

export function appUrl() {
  if (process.env.NODE_ENV !== "production") {
    return process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000";
  }
  return SITE_URL;
}
