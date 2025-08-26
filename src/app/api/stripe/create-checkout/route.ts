import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    
    // Check for existing customer in database
    const dbUser = await d1.getUser(userId);
    let customerId = dbUser?.stripe_customer_id;
    
    if (!customerId && email) {
      // Check if customer exists by email
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email,
          metadata: {
            clerkUserId: userId,
          },
        });
        customerId = customer.id;
      }
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID not configured');
    }

    const { origin } = new URL(request.url);

    console.log('Creating checkout session for userId:', userId);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: !customerId ? email : undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/debate?upgraded=true`,
      cancel_url: `${origin}/debate?canceled=true`,
      metadata: {
        clerkUserId: userId,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
        },
      },
    });
    
    console.log('Checkout session created:', session.id, 'with metadata:', session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}