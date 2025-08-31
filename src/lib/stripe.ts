import Stripe from "stripe";

// Only throw error at runtime, not build time
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.warn("STRIPE_SECRET_KEY is not set - Stripe functionality will be disabled");
}

// Check if we're in production with test keys
const isTestKey = stripeKey?.startsWith("sk_test_") || false;
const keyType = isTestKey ? "TEST" : "LIVE";

// Log configuration (sanitized)
if (stripeKey) {
  console.log("Stripe Configuration:", {
    environment: process.env.NODE_ENV,
    keyType,
    keyPrefix: stripeKey.substring(0, 7),
    priceId: process.env.STRIPE_PRICE_ID,
  });

  if (process.env.NODE_ENV === "production" && isTestKey) {
    console.error("CRITICAL: Using TEST Stripe keys in PRODUCTION environment!");
    console.error("Please set LIVE Stripe keys in Vercel environment variables");
  }
}

export const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-07-30.basil",
}) : null as any;

export interface SubscriptionData {
  isSubscribed: boolean;
  stripePlan?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
