"use server";

import { redirect } from "next/navigation";
import { appUrl } from "@/lib/site";
import { ensureUserProfile } from "@/lib/identity/profile";
import { getSession, requireSession } from "@/lib/session";
import { billingProfile, saveStripeCustomer } from "./store";
import { getStripe, proPriceId, stripeConfigured } from "./stripe";

export async function startProCheckout() {
  const session = await requireSession("/pricing");
  if (!stripeConfigured()) {
    return { error: "Checkout is not configured yet." };
  }
  await ensureUserProfile(session.user.id);
  const stripe = getStripe();
  const profile = await billingProfile(session.user.id);
  let customerId = profile?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await saveStripeCustomer(session.user.id, customerId);
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: session.user.id,
    allow_promotion_codes: true,
    line_items: [{ price: proPriceId(), quantity: 1 }],
    success_url: `${appUrl()}/home?billing=success`,
    cancel_url: `${appUrl()}/pricing`,
    metadata: { userId: session.user.id },
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  });
  if (!checkout.url) return { error: "Stripe did not return a checkout URL." };
  redirect(checkout.url);
}

export async function openBillingPortal() {
  const session = await requireSession("/home");
  if (!stripeConfigured()) {
    return { error: "Billing portal is not configured yet." };
  }
  const profile = await billingProfile(session.user.id);
  if (!profile?.stripeCustomerId) {
    return { error: "No Stripe customer on this account yet." };
  }
  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${appUrl()}/pricing`,
  });
  redirect(portal.url);
}

export async function billingReady() {
  const session = await getSession();
  return {
    configured: stripeConfigured(),
    signedIn: Boolean(session),
  };
}
