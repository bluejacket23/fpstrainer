import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * Cancel Subscription Lambda
 * 
 * Cancels a user's Stripe subscription and downgrades them to the free plan.
 * The subscription will cancel at the end of the current billing period.
 */
export const handler = async (event: any) => {
  console.log('Cancel Subscription event:', JSON.stringify(event, null, 2));
  
  // Get userId from Cognito identity
  const userId = event.identity?.sub;
  
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
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });
    
    // Get user from database
    const userResult = await docClient.send(new GetCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId },
    }));
    
    if (!userResult.Item) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    const user = userResult.Item;
    const stripeSubscriptionId = user.stripeSubscriptionId;
    
    if (!stripeSubscriptionId) {
      // User doesn't have an active subscription
      // Just ensure they're on the free plan
      await docClient.send(new UpdateCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId },
        UpdateExpression: 'SET subscriptionPlan = :plan, clipsRemaining = :cr, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':plan': 'RECRUIT',
          ':cr': 1,
          ':ua': new Date().toISOString(),
        },
      }));
      
      return {
        success: true,
        message: 'No active subscription found. You are on the free plan.',
      };
    }
    
    // Cancel the subscription at the end of the current billing period
    const canceledSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    console.log('Subscription set to cancel at period end:', canceledSubscription.id);
    
    // Note: We don't immediately downgrade the user
    // The webhook will handle this when the subscription actually ends
    // This allows the user to keep their plan until the billing period ends
    
    return {
      success: true,
      message: 'Subscription will be cancelled at the end of your current billing period.',
      cancelAt: canceledSubscription.cancel_at 
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString() 
        : null,
      currentPeriodEnd: canceledSubscription.current_period_end 
        ? new Date(canceledSubscription.current_period_end * 1000).toISOString() 
        : null,
    };
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription',
    };
  }
};

