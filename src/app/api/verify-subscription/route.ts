import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase-server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const serviceSupabase = createServiceSupabase();
    const stripe = getStripe();

    // Parse optional session_id from body
    let sessionId: string | null = null;
    try {
      const body = await request.json();
      sessionId = body.session_id || null;
    } catch {
      // No body
    }

    // --- Path 1: Stripe session_id provided (most reliable, post-checkout) ---
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });

      const customerId = session.customer as string;
      const subscription = session.subscription as import("stripe").Stripe.Subscription | null;

      if (!customerId) {
        return NextResponse.json({ status: "none", verified: false, reason: "no_customer" });
      }

      // Find the user by customer ID
      const { data: profile } = await serviceSupabase
        .from("profiles")
        .select("id, subscription_status")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      const subStatus = subscription?.status;
      const isActive = subStatus === "active" || subStatus === "trialing";

      if (isActive && profile) {
        const newStatus = subStatus === "trialing" ? "trialing" : "active";
        const trialEnd = subscription?.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await serviceSupabase
          .from("profiles")
          .update({ subscription_status: newStatus, trial_ends_at: trialEnd })
          .eq("id", profile.id);

        return NextResponse.json({ status: newStatus, verified: true });
      }

      // Customer exists but subscription not active yet — try listing subscriptions
      if (customerId) {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
        const activeSub = subs.data.find((s) => s.status === "active" || s.status === "trialing");

        if (activeSub && profile) {
          const newStatus = activeSub.status === "trialing" ? "trialing" : "active";
          const trialEnd = activeSub.trial_end
            ? new Date(activeSub.trial_end * 1000).toISOString()
            : null;
          await serviceSupabase
            .from("profiles")
            .update({ subscription_status: newStatus, trial_ends_at: trialEnd })
            .eq("id", profile.id);
          return NextResponse.json({ status: newStatus, verified: true });
        }
      }

      return NextResponse.json({ status: "none", verified: false, reason: "subscription_not_ready" });
    }

    // --- Path 2: No session_id — fall back to auth-based lookup ---
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("stripe_customer_id, subscription_status")
      .eq("id", user.id)
      .single();

    // Already active/trialing
    if (profile?.subscription_status === "active" || profile?.subscription_status === "trialing") {
      return NextResponse.json({ status: profile.subscription_status, verified: true });
    }

    const customerId = profile?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ status: "none", verified: false, reason: "no_customer_id" });
    }

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
    const activeSub = subs.data.find((s) => s.status === "active" || s.status === "trialing");

    if (activeSub) {
      const newStatus = activeSub.status === "trialing" ? "trialing" : "active";
      const trialEnd = activeSub.trial_end
        ? new Date(activeSub.trial_end * 1000).toISOString()
        : null;

      await serviceSupabase
        .from("profiles")
        .update({ subscription_status: newStatus, trial_ends_at: trialEnd })
        .eq("id", user.id);

      return NextResponse.json({ status: newStatus, verified: true });
    }

    return NextResponse.json({ status: "none", verified: false, reason: "no_active_subscription" });
  } catch (err) {
    console.error("Verify subscription error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
