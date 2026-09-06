/** Designated owner email used only to seed the OWNER role. */
export const OWNER_EMAIL = (
  process.env.ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ??
  "aruotu@gmail.com"
).trim().toLowerCase();

/** @deprecated Use OWNER_EMAIL. Kept for existing operator copy. */
export const ADMIN_EMAIL = OWNER_EMAIL;

export function isOwnerEmail(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

/** Seed helper only. Route protection must use OWNER permissions. */
export function isAdminEmail(email?: string | null) {
  return isOwnerEmail(email);
}
