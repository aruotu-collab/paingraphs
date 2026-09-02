import { SITE_URL } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email sending is not configured.");
    }
    console.info(`[magic-link] ${email} ${url}`);
    return;
  }

  const from =
    process.env.EMAIL_FROM ?? "PainGraphs <hello@paingraphs.com>";
  const safeUrl = escapeHtml(url);
  const text = [
    "Hi there,",
    "",
    "Use the secure link below to sign in to your PainGraphs account.",
    "",
    "Sign in to PainGraphs",
    "This link is unique to you and should only be used to access your account. For your security, please don't forward or share this email.",
    "",
    url,
    "",
    "If you didn't request this sign-in link, you can safely ignore this email.",
    "",
    "Thanks,",
    "PainGraphs",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
    <tr>
      <td align="left" style="padding:32px 24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Hi there,</p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">Use the secure link below to sign in to your <strong>PainGraphs</strong> account.</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;"><strong>Sign in to PainGraphs</strong></p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">This link is unique to you and should only be used to access your account. For your security, please don't forward or share this email.</p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">If you didn't request this sign-in link, you can safely ignore this email.</p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">Thanks,</p>
        <a href="${safeUrl}" style="display:inline-block;background:#c4923d;color:#111111;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Sign in to PainGraphs</a>
        <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#666666;">If the button does not work, paste this link into your browser:<br>${safeUrl}</p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#666666;"><a href="${SITE_URL}/privacy" style="color:#666666;">How email consent works</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Sign in to PainGraphs",
      text,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.slice(0, 180) || "Could not send the sign-in email.");
  }
}
