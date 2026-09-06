"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isWorkspaceMode, type WorkspaceMode } from "./constants";
import { ensureUserProfile, updateUserProfile } from "./profile";

export async function setWorkspaceMode(mode: WorkspaceMode) {
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  if (!isWorkspaceMode(mode)) return { error: "Unknown mode." };

  const profile = await ensureUserProfile(session.user.id);
  await updateUserProfile(session.user.id, {
    primaryMode: mode,
    affiliateEnabled: profile.affiliateEnabled || mode === "promote",
    founderEnabled: profile.founderEnabled || mode === "build",
  });
  revalidatePath("/home");
  return { ok: true };
}

export async function applySignupLenses(input: {
  affiliate?: boolean;
  founder?: boolean;
}) {
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  await ensureUserProfile(session.user.id, input);
  revalidatePath("/home");
  return { ok: true };
}
