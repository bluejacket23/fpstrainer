import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.USER_TABLE_NAME;
const REFERRAL_BONUS_CLIPS = 10;
const MIN_PLAN_FOR_REFERRAL = 'ROOKIE'; // $5+ plans

/**
 * Handle Referral Lambda
 * Called when a new user signs up with a referral code
 */
export const handler = async (event: any) => {
  const { newUserId, referralCode } = event;
  
  if (!newUserId || !referralCode) {
    return {
      success: false,
      error: 'Missing newUserId or referralCode',
    };
  }
  
  try {
    // Find referrer by referral code
    // Note: This assumes referralCode is stored in User table
    // You might need a separate ReferralCodes table for better performance
    
    // Get new user to check their plan
    const newUserResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId: newUserId },
    }));
    
    if (!newUserResult.Item) {
      return { success: false, error: 'New user not found' };
    }
    
    const newUserPlan = newUserResult.Item.subscriptionPlan || 'RECRUIT';
    
    // Check if new user is on a paid plan ($5+)
    const planPrices: Record<string, number> = {
      RECRUIT: 0,
      ROOKIE: 5,
      COMPETITIVE: 10,
      ELITE: 15,
      PRO: 29,
      GOD: 59,
    };
    
    const newUserPrice = planPrices[newUserPlan] || 0;
    const minPrice = planPrices[MIN_PLAN_FOR_REFERRAL] || 5;
    
    if (newUserPrice < minPrice) {
      return {
        success: false,
        error: 'Referrer only gets bonus if new user is on a paid plan ($5+)',
      };
    }
    
    // Find referrer by referral code
    // This is a simplified version - in production, use a GSI or separate table
    // For now, we'll assume referralCode matches userId or is stored in User table
    const referrerResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId: referralCode }, // Simplified: assuming referralCode is userId
    }));
    
    if (!referrerResult.Item) {
      // Try to find by referralCode field if it exists
      // In production, use a query with GSI
      return { success: false, error: 'Referrer not found' };
    }
    
    const referrer = referrerResult.Item;
    
    // Award bonus clips to referrer
    const currentClips = referrer.clipsRemaining || 0;
    const newClips = currentClips + REFERRAL_BONUS_CLIPS;
    
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId: referrer.userId },
      UpdateExpression: 'SET clipsRemaining = :cr, updatedAt = :ua',
      ExpressionAttributeValues: {
        ':cr': newClips,
        ':ua': new Date().toISOString(),
      },
    }));
    
    // Update new user to track who referred them
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId: newUserId },
      UpdateExpression: 'SET referredBy = :rb, updatedAt = :ua',
      ExpressionAttributeValues: {
        ':rb': referrer.userId,
        ':ua': new Date().toISOString(),
      },
    }));
    
    return {
      success: true,
      referrerUserId: referrer.userId,
      clipsAwarded: REFERRAL_BONUS_CLIPS,
      newClipsRemaining: newClips,
    };
  } catch (error: any) {
    console.error('Error handling referral:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

