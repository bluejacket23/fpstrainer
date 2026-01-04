import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(ddb);

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  RECRUIT: 1,
  ROOKIE: 10,
  COMPETITIVE: 25,
  ELITE: 50,
  PRO: 150,
  GOD: 500,
};

// Get price ID to plan mapping from environment
function getPriceIdToPlanMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  const priceIds = {
    ROOKIE: process.env.STRIPE_PRICE_ID_ROOKIE,
    COMPETITIVE: process.env.STRIPE_PRICE_ID_COMPETITIVE,
    ELITE: process.env.STRIPE_PRICE_ID_ELITE,
    PRO: process.env.STRIPE_PRICE_ID_PRO,
    GOD: process.env.STRIPE_PRICE_ID_GOD,
  };
  
  for (const [plan, priceId] of Object.entries(priceIds)) {
    if (priceId) {
      mapping[priceId] = plan;
    }
  }
  
  return mapping;
}

// Find user by Stripe customer ID
async function findUserByStripeCustomerId(customerId: string, tableName: string): Promise<any | null> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'stripeCustomerId = :cid',
      ExpressionAttributeValues: { ':cid': customerId },
      Limit: 1,
    }));
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}

// Find user by email
async function findUserByEmail(email: string, tableName: string): Promise<any | null> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
    }));
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Update user subscription
async function updateUserSubscription(
  userId: string,
  planName: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tableName: string
) {
  const clipsLimit = PLAN_LIMITS[planName] || 1;
  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: tableName,
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

// Downgrade user to free plan
async function downgradeUserToFree(userId: string, tableName: string) {
  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: tableName,
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

export async function POST(request: NextRequest) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const USER_TABLE_NAME = process.env.USER_TABLE_NAME;

  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!USER_TABLE_NAME) {
    console.error('USER_TABLE_NAME not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const PRICE_ID_TO_PLAN = getPriceIdToPlanMapping();

  // Get raw body and signature
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  // Verify webhook signature
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    console.warn('Webhook signature not verified');
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  console.log('Processing Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          await updateUserSubscription(userId, planName || 'ROOKIE', customerId, subscriptionId, USER_TABLE_NAME);
        } else {
          // Try to find by email
          const email = session.customer_email || session.customer_details?.email;
          if (email) {
            const user = await findUserByEmail(email, USER_TABLE_NAME);
            if (user) {
              await updateUserSubscription(user.userId, planName || 'ROOKIE', customerId, subscriptionId, USER_TABLE_NAME);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const newPlan = PRICE_ID_TO_PLAN[priceId];

        if (newPlan) {
          const user = await findUserByStripeCustomerId(customerId, USER_TABLE_NAME);
          if (user) {
            if (subscription.status === 'active') {
              await updateUserSubscription(user.userId, newPlan, customerId, subscription.id, USER_TABLE_NAME);
            } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
              await downgradeUserToFree(user.userId, USER_TABLE_NAME);
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await findUserByStripeCustomerId(customerId, USER_TABLE_NAME);
        
        if (user) {
          await downgradeUserToFree(user.userId, USER_TABLE_NAME);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Skip first invoice (handled by checkout.completed)
        if (invoice.billing_reason === 'subscription_create') {
          break;
        }

        const customerId = invoice.customer as string;
        const user = await findUserByStripeCustomerId(customerId, USER_TABLE_NAME);

        if (user) {
          // Reset monthly clips
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
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

