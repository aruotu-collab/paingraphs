"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

async function findUserByEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalised}`)
    .limit(1);
  return row ?? null;
}

export async function requestMagicLink(input: {
  mode: "login" | "signup";
  email: string;
  name?: string;
  callbackURL: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  const existing = await findUserByEmail(email);
  if (input.mode === "login" && !existing) {
    return { error: "no-account" };
  }

  try {
    await auth.api.signInMagicLink({
      headers: await headers(),
      body: {
        email,
        name: input.name || email.split("@")[0] || "there",
        callbackURL: input.callbackURL,
        newUserCallbackURL: input.callbackURL,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { error: message || "Could not send the sign-in link." };
  }

  return { ok: true as const };
}

export async function existingAccountFor(email: string) {
  return Boolean(await findUserByEmail(email));
}
