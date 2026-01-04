import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Cleanup Lambda - Deletes videos and frames after report is generated
 * KEEPS: thumbnails (thumbnails/{userId}/{reportId}.jpg)
 * DELETES: 
 *   - Original video (uploads/{userId}/{reportId}.mp4)
 *   - All frames (frames/{userId}/{reportId}/*.jpg)
 * 
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
  
  if (!BUCKET_NAME) {
    console.error('Missing BUCKET_NAME environment variable');
    return { success: false, error: 'Missing BUCKET_NAME' };
  }
  
  let deletedCount = 0;
  
  try {
    // 1. Delete the original uploaded video
    const videoKey = `uploads/${userId}/${reportId}.mp4`;
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
      }));
      console.log(`Deleted original video: ${videoKey}`);
      deletedCount++;
    } catch (error: any) {
      console.warn(`Could not delete video ${videoKey}:`, error.message);
    }
    
    // 2. Delete ALL frames in the frames/{userId}/{reportId}/ folder
    const framesPrefix = `frames/${userId}/${reportId}/`;
    try {
      // List all objects with the prefix
      let continuationToken: string | undefined;
      let totalFramesDeleted = 0;
      
      do {
        const listResult = await s3.send(new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: framesPrefix,
          ContinuationToken: continuationToken,
        }));
        
        if (listResult.Contents && listResult.Contents.length > 0) {
          // Delete each frame
          const deletePromises = listResult.Contents.map(async (obj) => {
            if (obj.Key) {
              try {
                await s3.send(new DeleteObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: obj.Key,
                }));
                totalFramesDeleted++;
              } catch (deleteError: any) {
                console.warn(`Failed to delete frame ${obj.Key}:`, deleteError.message);
              }
            }
          });
          
          await Promise.all(deletePromises);
        }
        
        continuationToken = listResult.NextContinuationToken;
      } while (continuationToken);
      
      console.log(`Deleted ${totalFramesDeleted} frames from ${framesPrefix}`);
      deletedCount += totalFramesDeleted;
    } catch (error: any) {
      console.warn(`Could not delete frames for ${framesPrefix}:`, error.message);
    }
    
    // 3. Clear frameUrls from DynamoDB to save storage (but keep other data)
    // NOTE: We keep thumbnailUrl because we didn't delete the thumbnail
    if (TABLE_NAME) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { userId, reportId },
          UpdateExpression: 'SET #cleanup = :cleanup, frameUrls = :empty, videoUrl = :empty',
          ExpressionAttributeNames: {
            '#cleanup': 'cleanupCompleted',
          },
          ExpressionAttributeValues: {
            ':cleanup': true,
            ':empty': null, // Clear the URLs since files are deleted
          },
        }));
        console.log('Cleared frameUrls and videoUrl from database');
      } catch (error: any) {
        console.warn('Could not update database:', error.message);
      }
    }
    
    console.log(`Cleanup completed for report ${reportId}. Deleted ${deletedCount} objects.`);
    console.log(`KEPT: thumbnails/${userId}/${reportId}.jpg (thumbnail preserved)`);
    
    return {
      success: true,
      deletedCount,
      reportId,
      kept: `thumbnails/${userId}/${reportId}.jpg`,
    };
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
