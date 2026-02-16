import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse optional body for plan selection (monthly/annual)
    let plan: "monthly" | "annual" = "monthly";
    try {
      const body = await request.json();
      if (body.plan === "annual") plan = "annual";
    } catch {
      // No body sent, default to monthly
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id;

    // Verify customer exists in Stripe, or create a new one
    if (customerId) {
      try {
        // Check if the customer still exists in Stripe
        await stripe.customers.retrieve(customerId);
        console.log("Checkout: Using existing Stripe customer:", customerId);
      } catch (error) {
        console.log("Checkout: Existing customer ID invalid:", error instanceof Error ? error.message : "Unknown error");
        console.log("Checkout: Creating new customer");
        customerId = null; // Customer doesn't exist, create a new one
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log("Checkout: Created new Stripe customer:", customerId);

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const priceId = plan === "annual"
      ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: `Stripe ${plan} price not configured` }, { status: 500 });
    }

    // Try to create the checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/plan/builder?subscribed=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
        subscription_data: {
          metadata: { supabase_user_id: user.id },
        },
        allow_promotion_codes: true,
      });
    } catch (checkoutError: any) {
      // If customer doesn't exist error, create new customer and retry
      if (checkoutError.message?.includes('No such customer')) {
        console.log("Checkout: Customer doesn't exist, creating new one");
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
        console.log("Checkout: Created new Stripe customer:", customerId);

        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);

        // Retry checkout session creation with new customer
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/plan/builder?subscribed=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
          subscription_data: {
            metadata: { supabase_user_id: user.id },
          },
          allow_promotion_codes: true,
        });
      } else {
        throw checkoutError;
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}



