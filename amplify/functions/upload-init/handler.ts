import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || TABLE_NAME?.replace('OpsCoachReport', 'User') || TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

// Plan limits
const PLAN_LIMITS: { [key: string]: number } = {
  'RECRUIT': 1,
  'ROOKIE': 10,
  'COMPETITIVE': 25,
  'ELITE': 50,
  'PRO': 150,
  'GOD': 500,
};

// Special email for unlimited testing
const TEST_EMAIL = 'lukecummings201372@gmail.com';

// Helper function to get or create user
async function getOrCreateUser(userId: string, email?: string) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId },
    }));
    
    if (result.Item) {
      // If user exists, check if they're test user and update to GOD plan if needed
      const userEmail = result.Item.email || email || '';
      const isTestUser = userEmail.toLowerCase() === TEST_EMAIL.toLowerCase();
      
      if (isTestUser && result.Item.subscriptionPlan !== 'GOD') {
        // Update existing user to GOD plan
        await docClient.send(new UpdateCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId },
          UpdateExpression: 'SET subscriptionPlan = :p, clipsRemaining = :cr, updatedAt = :ua',
          ExpressionAttributeValues: {
            ':p': 'GOD',
            ':cr': PLAN_LIMITS['GOD'],
            ':ua': new Date().toISOString(),
          },
        }));
        return {
          ...result.Item,
          subscriptionPlan: 'GOD',
          clipsRemaining: PLAN_LIMITS['GOD'],
        };
      }
      
      return result.Item;
    }
    
    // Create new user with RECRUIT plan (or GOD for test email)
    const now = new Date().toISOString();
    const userEmail = email || '';
    const isTestUser = userEmail.toLowerCase() === TEST_EMAIL.toLowerCase();
    const plan = isTestUser ? 'GOD' : 'RECRUIT';
    const clipsLimit = PLAN_LIMITS[plan];
    
    const newUser = {
      userId,
      email: userEmail,
      subscriptionPlan: plan,
      clipsRemaining: clipsLimit,
      clipsUsedThisMonth: 0,
      monthStartDate: now,
      createdAt: now,
      updatedAt: now,
    };
    
    await docClient.send(new PutCommand({
      TableName: USER_TABLE_NAME,
      Item: newUser,
    }));
    
    return newUser;
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
}

// Helper function to check and reset monthly clips if needed
function shouldResetMonth(monthStartDate: string): boolean {
  if (!monthStartDate) return true;
  
  const startDate = new Date(monthStartDate);
  const now = new Date();
  
  // Reset if different month
  return startDate.getMonth() !== now.getMonth() || 
         startDate.getFullYear() !== now.getFullYear();
}

// Helper function to check clips and decrement
async function checkAndDecrementClips(userId: string, email?: string) {
  const user = await getOrCreateUser(userId, email);
  const userEmail = user.email || email || '';
  const isTestUser = userEmail.toLowerCase() === TEST_EMAIL.toLowerCase();
  
  // Test user gets unlimited
  if (isTestUser) {
    return { allowed: true, clipsRemaining: 999, plan: 'GOD' };
  }
  
  let currentPlan = user.subscriptionPlan || 'RECRUIT';
  let clipsRemaining = user.clipsRemaining ?? PLAN_LIMITS[currentPlan];
  let clipsUsed = user.clipsUsedThisMonth || 0;
  let monthStartDate = user.monthStartDate || new Date().toISOString();
  
  // Reset if new month
  if (shouldResetMonth(monthStartDate)) {
    clipsRemaining = PLAN_LIMITS[currentPlan];
    clipsUsed = 0;
    monthStartDate = new Date().toISOString();
  }
  
  // Check if user has clips remaining
  if (clipsRemaining <= 0) {
    return {
      allowed: false,
      clipsRemaining: 0,
      plan: currentPlan,
      message: `You've used all your clips for this month. Upgrade your plan to get more clips.`,
    };
  }
  
  // Decrement clips
  clipsRemaining--;
  clipsUsed++;
  
  await docClient.send(new UpdateCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId },
    UpdateExpression: 'SET clipsRemaining = :cr, clipsUsedThisMonth = :cu, monthStartDate = :ms, updatedAt = :ua',
    ExpressionAttributeValues: {
      ':cr': clipsRemaining,
      ':cu': clipsUsed,
      ':ms': monthStartDate,
      ':ua': new Date().toISOString(),
    },
  }));
  
  return {
    allowed: true,
    clipsRemaining,
    plan: currentPlan,
  };
}

export const handler = async (event: any) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', {
    TABLE_NAME: TABLE_NAME ? 'SET' : 'MISSING',
    USER_TABLE_NAME: USER_TABLE_NAME ? 'SET' : 'MISSING',
    BUCKET_NAME: BUCKET_NAME ? 'SET' : 'MISSING',
  });
  
  try {
    // AppSync resolver event structure
    const userId = event.identity?.sub;
    const email = event.identity?.claims?.email || event.identity?.claims?.['cognito:email'] || '';
    console.log('User ID:', userId, 'Email:', email);
    
    if (!userId) {
      console.error('No user ID found in event.identity');
      throw new Error('User not authenticated');
    }
    
    if (!TABLE_NAME) {
      console.error('TABLE_NAME environment variable is missing');
      throw new Error('TABLE_NAME environment variable is not set');
    }
    
    if (!BUCKET_NAME) {
      console.error('BUCKET_NAME environment variable is missing');
      throw new Error('BUCKET_NAME environment variable is not set');
    }
    
    // Check clips before allowing upload
    const clipCheck = await checkAndDecrementClips(userId, email);
    
    if (!clipCheck.allowed) {
      throw new Error(clipCheck.message || 'No clips remaining for this month. Please upgrade your plan.');
    }
    
    console.log('Clip check passed:', clipCheck);
    
    const reportId = uuidv4();
    const key = `uploads/${userId}/${reportId}.mp4`;
    
    console.log('Creating DB record for:', { userId, reportId, tableName: TABLE_NAME });
    
    // 1. Create DB Record
    // Note: Set owner field for Amplify owner() authorization
    // Format: sub::username (or just sub/username as fallback)
    const username = event.identity?.claims?.username || event.identity?.claims?.['cognito:username'] || userId;
    const owner = `${userId}::${username}`;
    
    const timestamp = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        reportId,
        timestamp,
        processingStatus: 'UPLOADING',
        videoUrl: `s3://${BUCKET_NAME}/${key}`,
        frameUrls: [],
        owner, // Required for Amplify owner() authorization
      }
    }));
    
    console.log('DB record created successfully');
    
    // 2. Generate Presigned URL
    console.log('Generating presigned URL for:', { bucket: BUCKET_NAME, key });
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: 'video/mp4',
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    console.log('Presigned URL generated successfully');
    
    return {
      uploadUrl,
      reportId,
      key
    };
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error; // Re-throw with original error message instead of generic "Internal Server Error"
  }
};

