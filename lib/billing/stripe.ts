import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID,
  );
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export function proPriceId() {
  const id = process.env.STRIPE_PRO_PRICE_ID;
  if (!id) throw new Error("Stripe Pro price is not configured.");
  return id;
}

export function webhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook secret is not configured.");
  return secret;
}

export function planFromStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

export function cancelAtFromSubscription(subscription: Stripe.Subscription) {
  return subscription.cancel_at ?? null;
}

export function formatAccessUntil(unix: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(unix * 1000));
}
