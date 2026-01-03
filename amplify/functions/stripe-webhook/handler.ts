import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  RECRUIT: 1,
  ROOKIE: 10,
  COMPETITIVE: 25,
  ELITE: 50,
  PRO: 150,
  GOD: 500,
};

// Map Stripe Price IDs to plan names
// These are set dynamically from environment variables
const PRICE_ID_TO_PLAN: Record<string, string> = {};

function initializePriceMapping() {
  const priceIds = {
    ROOKIE: process.env.STRIPE_PRICE_ID_ROOKIE,
    COMPETITIVE: process.env.STRIPE_PRICE_ID_COMPETITIVE,
    ELITE: process.env.STRIPE_PRICE_ID_ELITE,
    PRO: process.env.STRIPE_PRICE_ID_PRO,
    GOD: process.env.STRIPE_PRICE_ID_GOD,
  };
  
  for (const [plan, priceId] of Object.entries(priceIds)) {
    if (priceId) {
      PRICE_ID_TO_PLAN[priceId] = plan;
    }
  }
}

/**
 * Stripe Webhook Handler
 * 
 * Handles subscription lifecycle events from Stripe:
 * - checkout.session.completed: User completed payment
 * - customer.subscription.created: New subscription started
 * - customer.subscription.updated: Subscription plan changed
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.payment_succeeded: Recurring payment successful (monthly reset)
 * - invoice.payment_failed: Payment failed
 */
export const handler = async (event: any) => {
  console.log('Stripe webhook received');
  
  initializePriceMapping();
  
  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }
  
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });
  
  // Get the raw body and signature
  const body = event.body;
  const sig = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'];
  
  let stripeEvent: Stripe.Event;
  
  // Verify webhook signature (important for security!)
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try {
      stripeEvent = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: `Webhook Error: ${err.message}` }) 
      };
    }
  } else {
    // For testing without signature verification (NOT recommended for production)
    console.warn('Webhook signature not verified - STRIPE_WEBHOOK_SECRET not set');
    try {
      stripeEvent = JSON.parse(body);
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
  }
  
  console.log('Processing event:', stripeEvent.type);
  
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe);
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, stripe);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, stripe);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, stripe);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, stripe);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, stripe);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }
    
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};

/**
 * Handle checkout.session.completed
 * Called when a customer completes the Stripe checkout flow
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  console.log('Handling checkout.session.completed:', session.id);
  
  const userId = session.metadata?.userId;
  const planName = session.metadata?.planName;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  if (!userId) {
    console.error('No userId in session metadata');
    // Try to find user by email
    const customerEmail = session.customer_email || session.customer_details?.email;
    if (customerEmail) {
      const user = await findUserByEmail(customerEmail);
      if (user) {
        await updateUserSubscription(user.userId, planName || 'ROOKIE', customerId, subscriptionId);
        return;
      }
    }
    throw new Error('Could not identify user from checkout session');
  }
  
  await updateUserSubscription(userId, planName || 'ROOKIE', customerId, subscriptionId);
}

/**
 * Handle customer.subscription.created
 * Called when a new subscription is created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Handling customer.subscription.created:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  const planName = subscription.metadata?.planName;
  const customerId = subscription.customer as string;
  
  if (!userId) {
    // Try to find by customer ID
    const user = await findUserByStripeCustomerId(customerId);
    if (user) {
      const priceId = subscription.items.data[0]?.price.id;
      const plan = PRICE_ID_TO_PLAN[priceId] || planName || 'ROOKIE';
      await updateUserSubscription(user.userId, plan, customerId, subscription.id);
      return;
    }
    console.error('Could not find user for subscription:', subscription.id);
    return;
  }
  
  const priceId = subscription.items.data[0]?.price.id;
  const plan = PRICE_ID_TO_PLAN[priceId] || planName || 'ROOKIE';
  
  await updateUserSubscription(userId, plan, customerId, subscription.id);
}

/**
 * Handle customer.subscription.updated
 * Called when a subscription is modified (plan change, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Handling customer.subscription.updated:', subscription.id);
  
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const newPlan = PRICE_ID_TO_PLAN[priceId];
  
  if (!newPlan) {
    console.log('Price ID not mapped to a plan:', priceId);
    return;
  }
  
  // Find user by customer ID or subscription metadata
  let userId = subscription.metadata?.userId;
  
  if (!userId) {
    const user = await findUserByStripeCustomerId(customerId);
    if (user) {
      userId = user.userId;
    }
  }
  
  if (!userId) {
    console.error('Could not find user for subscription update');
    return;
  }
  
  // Check subscription status
  if (subscription.status === 'active') {
    await updateUserSubscription(userId, newPlan, customerId, subscription.id);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await downgradeUserToFree(userId);
  }
}

/**
 * Handle customer.subscription.deleted
 * Called when a subscription is cancelled/deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Handling customer.subscription.deleted:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  // Find user by customer ID
  const user = await findUserByStripeCustomerId(customerId);
  
  if (!user) {
    // Try by subscription metadata
    const userId = subscription.metadata?.userId;
    if (userId) {
      await downgradeUserToFree(userId);
      return;
    }
    console.error('Could not find user for cancelled subscription');
    return;
  }
  
  await downgradeUserToFree(user.userId);
}

/**
 * Handle invoice.payment_succeeded
 * Called when a recurring payment succeeds - reset monthly clips
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Handling invoice.payment_succeeded:', invoice.id);
  
  // Skip if this is the first invoice (handled by checkout.completed)
  if (invoice.billing_reason === 'subscription_create') {
    console.log('Skipping - handled by checkout.session.completed');
    return;
  }
  
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  
  // Find user by customer ID
  const user = await findUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('Could not find user for invoice');
    return;
  }
  
  // Reset monthly clips for the user
  const plan = user.subscriptionPlan || 'RECRUIT';
  const clipsLimit = PLAN_LIMITS[plan] || 1;
  
  await docClient.send(new UpdateCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId: user.userId },
    UpdateExpression: 'SET clipsRemaining = :cr, clipsUsedThisMonth = :cu, monthStartDate = :ms, updatedAt = :ua',
    ExpressionAttributeValues: {
      ':cr': clipsLimit,
      ':cu': 0,
      ':ms': new Date().toISOString(),
      ':ua': new Date().toISOString(),
    },
  }));
  
  console.log(`Reset clips for user ${user.userId}: ${clipsLimit} clips`);
}

/**
 * Handle invoice.payment_failed
 * Called when a payment fails - notify user, potentially downgrade
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Handling invoice.payment_failed:', invoice.id);
  
  const customerId = invoice.customer as string;
  
  // Find user by customer ID
  const user = await findUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('Could not find user for failed invoice');
    return;
  }
  
  // For now, just log the failure
  // Stripe will automatically retry and eventually cancel the subscription
  // The subscription.deleted webhook will handle the downgrade
  console.log(`Payment failed for user ${user.userId} - Stripe will handle retries`);
  
  // Optionally: You could send an email notification here
  // await sendPaymentFailedEmail(user.email);
}

/**
 * Update user subscription in the database
 */
async function updateUserSubscription(
  userId: string, 
  planName: string, 
  stripeCustomerId: string, 
  stripeSubscriptionId: string
) {
  const clipsLimit = PLAN_LIMITS[planName] || 1;
  const now = new Date().toISOString();
  
  await docClient.send(new UpdateCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId },
    UpdateExpression: `
      SET subscriptionPlan = :plan,
          stripeCustomerId = :cid,
          stripeSubscriptionId = :sid,
          clipsRemaining = :cr,
          clipsUsedThisMonth = :cu,
          monthStartDate = :ms,
          updatedAt = :ua
    `,
    ExpressionAttributeValues: {
      ':plan': planName,
      ':cid': stripeCustomerId,
      ':sid': stripeSubscriptionId,
      ':cr': clipsLimit,
      ':cu': 0,
      ':ms': now,
      ':ua': now,
    },
  }));
  
  console.log(`Updated user ${userId} to plan ${planName} with ${clipsLimit} clips`);
}

/**
 * Downgrade user to free plan
 */
async function downgradeUserToFree(userId: string) {
  const now = new Date().toISOString();
  
  await docClient.send(new UpdateCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId },
    UpdateExpression: `
      SET subscriptionPlan = :plan,
          stripeSubscriptionId = :sid,
          clipsRemaining = :cr,
          clipsUsedThisMonth = :cu,
          monthStartDate = :ms,
          updatedAt = :ua
    `,
    ExpressionAttributeValues: {
      ':plan': 'RECRUIT',
      ':sid': null,
      ':cr': PLAN_LIMITS['RECRUIT'],
      ':cu': 0,
      ':ms': now,
      ':ua': now,
    },
  }));
  
  console.log(`Downgraded user ${userId} to RECRUIT plan`);
}

/**
 * Find user by email address
 */
async function findUserByEmail(email: string): Promise<any | null> {
  try {
    // Note: This requires a GSI on email field for efficient queries
    // For now, we'll do a scan (not ideal for large tables)
    const result = await docClient.send(new ScanCommand({
      TableName: USER_TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1,
    }));
    
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

/**
 * Find user by Stripe customer ID
 */
async function findUserByStripeCustomerId(customerId: string): Promise<any | null> {
  try {
    // Note: This requires a GSI on stripeCustomerId field for efficient queries
    // For now, we'll do a scan (not ideal for large tables)
    const result = await docClient.send(new ScanCommand({
      TableName: USER_TABLE_NAME,
      FilterExpression: 'stripeCustomerId = :cid',
      ExpressionAttributeValues: {
        ':cid': customerId,
      },
      Limit: 1,
    }));
    
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}
