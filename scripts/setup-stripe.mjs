import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY to the PainGraphs test secret key.");
  process.exit(1);
}

const stripe = new Stripe(key);

const products = await stripe.products.list({ limit: 100, active: true });
let product = products.data.find((item) => item.metadata.paingraphs === "pro");
if (!product) {
  product = await stripe.products.create({
    name: "PainGraphs Pro",
    description:
      "One subscription that unlocks Affiliate and Founder on the same PainGraphs account.",
    metadata: { paingraphs: "pro" },
  });
}

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
let price = prices.data.find(
  (item) =>
    item.currency === "gbp" &&
    item.unit_amount === 3900 &&
    item.recurring?.interval === "month",
);
if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: 3900,
    recurring: { interval: "month" },
    nickname: "Pro monthly",
    metadata: { paingraphs: "pro" },
  });
}

try {
  await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "PainGraphs billing",
      privacy_policy_url: "https://www.paingraphs.com/privacy",
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "name"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already|exist/i.test(message)) {
    console.warn("Portal config:", message);
  }
}

console.log(`STRIPE_PRO_PRICE_ID=${price.id}`);
console.log(`product=${product.id}`);
