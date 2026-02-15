// Google Analytics 4 — event helpers
// These only fire when NEXT_PUBLIC_GA_MEASUREMENT_ID is set

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Pre-built events for common RunSplit actions
export const analytics = {
  // Tool usage
  toolUsed: (toolName: string) =>
    trackEvent("tool_used", "Tools", toolName),

  // Calculator usage
  calculatorUsed: (calcName: string) =>
    trackEvent("calculator_used", "Calculators", calcName),

  // Plan views
  planViewed: (planSlug: string) =>
    trackEvent("plan_viewed", "Plans", planSlug),

  // Pro conversion funnel
  pricingViewed: () =>
    trackEvent("pricing_viewed", "Conversion"),

  checkoutStarted: (plan: "monthly" | "annual") =>
    trackEvent("checkout_started", "Conversion", plan),

  signupStarted: (method: string) =>
    trackEvent("signup_started", "Auth", method),

  loginCompleted: (method: string) =>
    trackEvent("login_completed", "Auth", method),

  // Strava
  stravaConnected: () =>
    trackEvent("strava_connected", "Integration"),

  stravaDisconnected: () =>
    trackEvent("strava_disconnected", "Integration"),

  // Plan builder
  planBuilderStarted: () =>
    trackEvent("plan_builder_started", "Pro"),

  planBuilderCompleted: () =>
    trackEvent("plan_builder_completed", "Pro"),

  // Hero interaction
  heroCalculatorUsed: (distance: string) =>
    trackEvent("hero_calculator_used", "Engagement", distance),
};


