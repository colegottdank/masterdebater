import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Check if we're in production with test keys
const isTestKey = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
if (process.env.NODE_ENV === "production" && isTestKey) {
  console.warn("WARNING: Using test Stripe keys in production environment");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
  timeout: 20000, // 20 second timeout
  maxNetworkRetries: 2,
});

export interface SubscriptionData {
  isSubscribed: boolean;
  stripePlan?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
