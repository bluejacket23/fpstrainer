import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Get Thumbnail URL Lambda
 * Regenerates presigned URL for thumbnails (useful when old URLs expire)
 */
export const handler = async (event: any) => {
  const { userId, reportId } = event;
  
  if (!userId || !reportId || !BUCKET_NAME || !TABLE_NAME) {
    return {
      success: false,
      error: 'Missing required parameters',
    };
  }
  
  try {
    // Get report to find thumbnail key
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    
    if (!result.Item) {
      return {
        success: false,
        error: 'Report not found',
      };
    }
    
    // Extract thumbnail key from stored URL or construct it
    let thumbnailKey: string | null = null;
    
    if (result.Item.thumbnailUrl) {
      // If it's an S3 URL, extract the key
      const url = result.Item.thumbnailUrl;
      if (url.includes('thumbnails/')) {
        thumbnailKey = url.split('thumbnails/')[1]?.split('?')[0];
        if (thumbnailKey) {
          thumbnailKey = `thumbnails/${thumbnailKey}`;
        }
      }
    }
    
    // If we couldn't extract from URL, construct it
    if (!thumbnailKey) {
      thumbnailKey = `thumbnails/${userId}/${reportId}.jpg`;
    }
    
    // Generate new presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
    });
    
    const thumbnailUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 1 week
    
    // Update database with new URL
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
      UpdateExpression: 'SET thumbnailUrl = :url',
      ExpressionAttributeValues: {
        ':url': thumbnailUrl,
      },
    }));
    
    return {
      success: true,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error('Error getting thumbnail URL:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

