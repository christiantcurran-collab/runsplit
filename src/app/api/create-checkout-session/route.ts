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

    // Parse optional body for plan selection (monthly/annual) and promo code
    let plan: "monthly" | "annual" = "monthly";
    let promoCode: string | undefined;
    try {
      const body = await request.json();
      if (body.plan === "annual") plan = "annual";
      if (typeof body.promoCode === "string" && body.promoCode.trim()) {
        promoCode = body.promoCode.trim().toUpperCase();
      }
    } catch {
      // No body sent, defaults apply
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

    // Resolve promo code to a Stripe promotion_code ID (pre-applying it ensures
    // Apple Pay sees the discounted price in the native payment sheet)
    let resolvedPromoCodeId: string | undefined;
    if (promoCode) {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (promoCodes.data.length === 0) {
        return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }
      resolvedPromoCodeId = promoCodes.data[0].id;
      console.log("Checkout: Applying promo code", promoCode, "→", resolvedPromoCodeId);
    }

    // Build shared session params. When a promo code is pre-applied we use
    // `discounts`; Stripe doesn't allow both `discounts` and `allow_promotion_codes`.
    const sessionParams = {
      mode: "subscription" as const,
      payment_method_types: ["card"] as ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/start/preview`,
      subscription_data: {
        trial_period_days: 3,
        metadata: { supabase_user_id: user.id },
      },
      ...(resolvedPromoCodeId
        ? { discounts: [{ promotion_code: resolvedPromoCodeId }] }
        : { allow_promotion_codes: true }),
    };

    // Try to create the checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({ customer: customerId, ...sessionParams });
    } catch (checkoutError: unknown) {
      // If customer doesn't exist error, create new customer and retry
      const errorMessage = checkoutError instanceof Error ? checkoutError.message : String(checkoutError);
      if (errorMessage.includes('No such customer')) {
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

        session = await stripe.checkout.sessions.create({ customer: customerId, ...sessionParams });
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



