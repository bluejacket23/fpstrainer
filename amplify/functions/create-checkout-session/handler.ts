import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fpstrainer.com';

// Stripe Price IDs - You'll need to create these in your Stripe Dashboard
// These should be set as environment variables
const STRIPE_PRICE_IDS: Record<string, string> = {
  ROOKIE: process.env.STRIPE_PRICE_ID_ROOKIE || '',
  COMPETITIVE: process.env.STRIPE_PRICE_ID_COMPETITIVE || '',
  ELITE: process.env.STRIPE_PRICE_ID_ELITE || '',
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
  GOD: process.env.STRIPE_PRICE_ID_GOD || '',
};

// Plan limits for reference
const PLAN_LIMITS: Record<string, number> = {
  RECRUIT: 1,
  ROOKIE: 10,
  COMPETITIVE: 25,
  ELITE: 50,
  PRO: 150,
  GOD: 500,
};

/**
 * Create Checkout Session Lambda
 * Creates a Stripe checkout session for plan upgrades
 * 
 * This function is called from the frontend when a user clicks to upgrade their plan.
 * It creates a Stripe Checkout session and returns the URL to redirect the user.
 */
export const handler = async (event: any) => {
  console.log('Create Checkout Session event:', JSON.stringify(event, null, 2));
  
  // Get userId from Cognito identity
  const userId = event.identity?.sub;
  const userEmail = event.identity?.claims?.email || event.identity?.claims?.['cognito:email'] || '';
  const planName = event.arguments?.planName;
  
  console.log('User ID:', userId, 'Email:', userEmail, 'Plan:', planName);
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated',
    };
  }
  
  if (!planName) {
    return {
      success: false,
      error: 'Missing planName',
    };
  }
  
  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return {
      success: false,
      error: 'Payment system not configured. Please contact support.',
    };
  }
  
  const priceId = STRIPE_PRICE_IDS[planName];
  if (!priceId) {
    return { 
      success: false, 
      error: `Invalid plan name: ${planName}. Available plans: ${Object.keys(STRIPE_PRICE_IDS).join(', ')}` 
    };
  }
  
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });
    
    // Get user from database
    const userResult = await docClient.send(new GetCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId },
    }));
    
    let stripeCustomerId = userResult.Item?.stripeCustomerId;
    
    // If user doesn't have a Stripe customer ID, we'll create one during checkout
    // But first check if customer exists by email
    if (!stripeCustomerId && userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        
        // Save customer ID to user record
        await docClient.send(new UpdateCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId },
          UpdateExpression: 'SET stripeCustomerId = :cid, updatedAt = :ua',
          ExpressionAttributeValues: {
            ':cid': stripeCustomerId,
            ':ua': new Date().toISOString(),
          },
        }));
      }
    }
    
    // Check if user already has an active subscription
    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        // User has an active subscription - redirect to customer portal for plan changes
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${FRONTEND_URL}/account`,
        });
        
        return {
          success: true,
          url: portalSession.url,
          isPortal: true,
          message: 'Redirecting to subscription management portal',
        };
      }
    }
    
    // Create checkout session for new subscription
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/account?canceled=true`,
      metadata: {
        userId,
        planName,
      },
      subscription_data: {
        metadata: {
          userId,
          planName,
        },
      },
      allow_promotion_codes: true,
    };
    
    // If we have an existing customer, use them
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    } else if (userEmail) {
      // Otherwise, pre-fill email for new customer
      sessionConfig.customer_email = userEmail;
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('Checkout session created:', session.id);
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
};
