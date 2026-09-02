/** Sole operator account. Override with ADMIN_EMAIL if needed. */
export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ??
  "aruotu@gmail.com"
).trim().toLowerCase();

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
