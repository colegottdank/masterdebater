import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { d1 } from '@/lib/d1';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Use local webhook secret in development (from stripe listen)
    const localWebhookSecret = 'whsec_6073f6322105baf89ec9cd52d220afa9103727518b333c66a641f5ee5960a5ce';
    const webhookSecret = process.env.NODE_ENV === 'development' 
      ? localWebhookSecret 
      : process.env.STRIPE_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Parse without verification for testing (remove this in production)
      event = JSON.parse(body) as Stripe.Event;
      console.warn('⚠️ Webhook signature not verified - configure STRIPE_WEBHOOK_SECRET');
    }
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        
        console.log('Checkout completed - clerkUserId:', clerkUserId, 'subscription:', session.subscription);
        
        if (clerkUserId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          console.log('Updating user subscription for:', clerkUserId);
          
          // Save to database
          const updateResult = await d1.upsertUser({
            clerkUserId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePlan: 'premium',
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
          
          console.log('Database update result:', updateResult);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerkUserId;
        
        if (clerkUserId) {
          const periodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined;
            
          await d1.upsertUser({
            clerkUserId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripePlan: subscription.status === 'active' ? 'premium' : undefined,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerkUserId;
        
        if (clerkUserId) {
          await d1.upsertUser({
            clerkUserId,
            stripePlan: null,
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;
        
        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription as string);
          const clerkUserId = sub.metadata?.clerkUserId;
          
          if (clerkUserId) {
            await d1.upsertUser({
              clerkUserId,
              subscriptionStatus: 'past_due',
              stripePlan: null,
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}