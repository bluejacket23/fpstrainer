import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Cleanup Lambda - Deletes videos and frames after report is generated
 * Should be invoked after ai-analysis completes successfully
 */
export const handler = async (event: any) => {
  console.log('Cleanup event:', JSON.stringify(event, null, 2));
  
  // Handle both direct invocation and wrapped events
  const eventData = typeof event === 'string' ? JSON.parse(event) : event;
  const userId = eventData.userId;
  const reportId = eventData.reportId;
  
  if (!userId || !reportId) {
    console.error('Missing userId or reportId', { userId, reportId });
    return { success: false, error: 'Missing required parameters' };
  }
  
  if (!BUCKET_NAME || !TABLE_NAME) {
    console.error('Missing environment variables');
    return { success: false, error: 'Missing environment variables' };
  }
  
  try {
    // Get report to find video and frame URLs
    const reportResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    
    if (!reportResult.Item) {
      console.log('Report not found, skipping cleanup');
      return { success: false, error: 'Report not found' };
    }
    
    const report = reportResult.Item;
    const videoUrl = report.videoUrl;
    const frameUrls = report.frameUrls || [];
    
    // Extract S3 keys from URLs
    const keysToDelete: string[] = [];
    
    // Add video key
    if (videoUrl) {
      // Extract key from s3://bucket/key or full URL
      const videoKey = videoUrl.includes('s3://') 
        ? videoUrl.replace(`s3://${BUCKET_NAME}/`, '')
        : videoUrl.split('/').slice(-2).join('/'); // Get last 2 parts (userId/reportId.mp4)
      keysToDelete.push(videoKey);
    }
    
    // Add frame keys
    if (Array.isArray(frameUrls)) {
      frameUrls.forEach((frameUrl: string) => {
        if (frameUrl) {
          const frameKey = frameUrl.includes('s3://')
            ? frameUrl.replace(`s3://${BUCKET_NAME}/`, '')
            : frameUrl;
          keysToDelete.push(frameKey);
        }
      });
    }
    
    // Delete all objects from S3
    const deletePromises = keysToDelete.map(async (key: string) => {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        }));
        console.log(`Deleted: ${key}`);
      } catch (error: any) {
        console.error(`Error deleting ${key}:`, error.message);
        // Don't throw - continue with other deletions
      }
    });
    
    await Promise.all(deletePromises);
    
    // Update report to mark cleanup as done (optional - for tracking)
    try {
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, reportId },
        UpdateExpression: 'SET #cleanup = :cleanup',
        ExpressionAttributeNames: {
          '#cleanup': 'cleanupCompleted',
        },
        ExpressionAttributeValues: {
          ':cleanup': true,
        },
      }));
    } catch (error) {
      console.warn('Could not update cleanup flag:', error);
    }
    
    console.log(`Cleanup completed for report ${reportId}. Deleted ${keysToDelete.length} objects.`);
    
    return {
      success: true,
      deletedCount: keysToDelete.length,
      reportId,
    };
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

