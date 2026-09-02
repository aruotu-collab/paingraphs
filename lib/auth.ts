import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";

const appUrl = getAppUrl();

const trustedOrigins = Array.from(
  new Set([
    appUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://paingraphs.com",
    "https://www.paingraphs.com",
    "https://paingraphs.vercel.app",
  ]),
);

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
    }),
    nextCookies(),
  ],
});
