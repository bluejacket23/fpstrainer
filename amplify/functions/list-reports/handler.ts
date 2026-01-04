import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event: any) => {
  console.log('List reports event:', JSON.stringify(event, null, 2));
  
  // AppSync Lambda resolver event structure
  // event.identity.sub contains the user ID
  const userId = event.identity?.sub || event.identity?.claims?.sub || event.arguments?.userId;
  
  console.log('Extracted userId:', userId);
  console.log('Event identity:', JSON.stringify(event.identity, null, 2));
  
  if (!userId) {
    console.error('No userId found in event:', JSON.stringify(event, null, 2));
    throw new Error('User ID is required');
  }
  
  if (!TABLE_NAME) {
    throw new Error('TABLE_NAME environment variable is not set');
  }
  
  try {
    // Query all reports for this userId
    // Since userId is the partition key, we can query directly
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      // Sort by timestamp descending (newest first)
      ScanIndexForward: false,
    }));
    
    console.log(`Found ${result.Items?.length || 0} reports for userId: ${userId}`);
    console.log(`BUCKET_NAME: ${BUCKET_NAME || 'NOT SET'}`);
    
    // Try to extract bucket name from existing URL if env var not set
    let bucketName = BUCKET_NAME;
    if (!bucketName && result.Items?.length) {
      // Try to extract from an existing thumbnailUrl
      const sampleUrl = result.Items.find((i: any) => i.thumbnailUrl)?.thumbnailUrl;
      if (sampleUrl) {
        // URL format: https://{bucket}.s3.{region}.amazonaws.com/...
        const match = sampleUrl.match(/https:\/\/([^.]+)\.s3\.[^/]+\.amazonaws\.com/);
        if (match) {
          bucketName = match[1];
          console.log(`Extracted bucket name from URL: ${bucketName}`);
        }
      }
    }
    
    // Process items and refresh thumbnail URLs if needed
    const items = await Promise.all((result.Items || []).map(async (item: any) => {
      const now = new Date().toISOString();
      let thumbnailUrl = item.thumbnailUrl;
      
      // Only refresh if we have a bucket name and report has a thumbnail
      if (bucketName) {
        try {
          // Check if the thumbnail exists in S3 and generate a fresh URL
          const thumbnailKey = `thumbnails/${userId}/${item.reportId}.jpg`;
          
          // Verify thumbnail exists
          try {
            await s3.send(new HeadObjectCommand({
              Bucket: bucketName,
              Key: thumbnailKey,
            }));
            
            // Generate fresh presigned URL (valid for 7 days)
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: thumbnailKey,
            });
            thumbnailUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });
            
            // Update database with new URL (fire and forget)
            docClient.send(new UpdateCommand({
              TableName: TABLE_NAME!,
              Key: { userId, reportId: item.reportId },
              UpdateExpression: 'SET thumbnailUrl = :url',
              ExpressionAttributeValues: { ':url': thumbnailUrl },
            })).catch(err => console.warn('Failed to update thumbnail URL:', err.message));
            
            console.log(`Refreshed thumbnail URL for ${item.reportId}`);
            
          } catch (headErr: any) {
            // Thumbnail doesn't exist in S3
            console.warn(`Thumbnail not found for ${item.reportId}:`, headErr.message);
            thumbnailUrl = null;
          }
        } catch (err: any) {
          console.warn(`Error refreshing thumbnail for ${item.reportId}:`, err.message);
        }
      }
      
      return {
        ...item,
        thumbnailUrl,
        createdAt: item.createdAt || item.timestamp || now,
        updatedAt: item.updatedAt || item.timestamp || now,
      };
    }));
    
    return items;
  } catch (error) {
    console.error('Error querying reports:', error);
    throw new Error('Failed to fetch reports');
  }
};

