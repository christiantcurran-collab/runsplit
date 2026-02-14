import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceSupabase } from "@/lib/supabase-server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        let subStatus: "active" | "trialing" | "cancelled" | "none" = "none";
        if (status === "active") subStatus = "active";
        else if (status === "trialing") subStatus = "trialing";
        else if (status === "canceled" || status === "unpaid" || status === "past_due") subStatus = "cancelled";

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        // Try to link via metadata first, then via customer_id
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: subStatus,
              trial_ends_at: trialEnd,
              stripe_customer_id: customerId,
            })
            .eq("id", userId);
        } else {
          await supabase
            .from("profiles")
            .update({
              subscription_status: subStatus,
              trial_ends_at: trialEnd,
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;

        // Get the user ID from subscription metadata or session metadata
        let userId = session.metadata?.supabase_user_id;

        if (!userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          userId = sub.metadata?.supabase_user_id;
        }

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_status: "active",
            })
            .eq("id", userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Don't immediately cancel — just log. Stripe will retry.
        console.warn(`Payment failed for customer ${customerId}, invoice ${invoice.id}`);

        // After all retries fail, Stripe will fire customer.subscription.deleted
        // which we handle above to set status to "cancelled"
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Ensure the subscription is marked active after successful payment
        // Invoice paid events relate to subscriptions, so mark active
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
