import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fpstrainer.com';

/**
 * Customer Portal Lambda
 * 
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * The portal allows customers to:
 * - Update payment methods
 * - View/download invoices
 * - Change subscription plans
 * - Cancel subscription
 */
export const handler = async (event: any) => {
  console.log('Customer Portal event:', JSON.stringify(event, null, 2));
  
  // Get userId from Cognito identity
  const userId = event.identity?.sub;
  const userEmail = event.identity?.claims?.email || event.identity?.claims?.['cognito:email'] || '';
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated',
    };
  }
  
  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return {
      success: false,
      error: 'Payment system not configured. Please contact support.',
    };
  }
  
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' });
    
    // Get user from database
    const userResult = await docClient.send(new GetCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId },
    }));
    
    let stripeCustomerId = userResult.Item?.stripeCustomerId;
    
    // If user doesn't have a Stripe customer ID, try to find by email or create one
    if (!stripeCustomerId && userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId,
          },
        });
        stripeCustomerId = customer.id;
      }
      
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
    
    if (!stripeCustomerId) {
      return {
        success: false,
        error: 'No payment history found. Please subscribe to a plan first.',
      };
    }
    
    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${FRONTEND_URL}/account`,
    });
    
    console.log('Portal session created:', portalSession.id);
    
    return {
      success: true,
      url: portalSession.url,
    };
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create portal session',
    };
  }
};



