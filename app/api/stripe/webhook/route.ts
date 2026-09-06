import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applySubscription } from "@/lib/billing/store";
import {
  cancelAtFromSubscription,
  getStripe,
  webhookSecret,
} from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function fromCheckout(session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  let status: string | null = null;
  let cancelAt: number | null = null;
  if (subscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    status = subscription.status;
    cancelAt = cancelAtFromSubscription(subscription);
  }
  await applySubscription({
    userId: session.metadata?.userId ?? session.client_reference_id,
    customerId: customerId(session.customer),
    subscriptionId,
    status: status ?? (session.status === "complete" ? "active" : null),
    cancelAt,
  });
}

async function fromSubscription(subscription: Stripe.Subscription) {
  await applySubscription({
    userId: subscription.metadata?.userId ?? null,
    customerId: customerId(subscription.customer),
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAt: cancelAtFromSubscription(subscription),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await fromCheckout(event.data.object);
  }
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await fromSubscription(event.data.object);
  }

  return NextResponse.json({ ok: true });
}
