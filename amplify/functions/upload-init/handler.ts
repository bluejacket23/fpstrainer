import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event: any) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', {
    TABLE_NAME: TABLE_NAME ? 'SET' : 'MISSING',
    BUCKET_NAME: BUCKET_NAME ? 'SET' : 'MISSING',
  });
  
  try {
    // AppSync resolver event structure
    const userId = event.identity?.sub;
    console.log('User ID:', userId);
    
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

