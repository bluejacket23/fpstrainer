import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';

// NOTE: Ensure an FFmpeg Lambda Layer is attached to this function.
// If using a static binary, set FFMPEG_PATH.
// ffmpeg.setFfmpegPath('/opt/bin/ffmpeg'); // Example for layer

// Configure S3 client with explicit region
const s3 = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-2' 
});
const lambda = new LambdaClient({ 
  region: process.env.AWS_REGION || 'us-east-2' 
});
const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const BUCKET_NAME = process.env.BUCKET_NAME;
const AI_FUNCTION_NAME = process.env.AI_FUNCTION_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', {
    BUCKET_NAME: BUCKET_NAME ? 'SET' : 'MISSING',
    AI_FUNCTION_NAME: AI_FUNCTION_NAME ? 'SET' : 'MISSING',
    TABLE_NAME: TABLE_NAME ? 'SET' : 'MISSING',
    AWS_REGION: process.env.AWS_REGION || 'us-east-2',
  });
  
  if (!BUCKET_NAME) {
    console.error('BUCKET_NAME environment variable is missing!');
    throw new Error('BUCKET_NAME environment variable is not set');
  }
  
  if (!AI_FUNCTION_NAME) {
    console.error('AI_FUNCTION_NAME environment variable is missing!');
    throw new Error('AI_FUNCTION_NAME environment variable is not set');
  }
  
  for (const record of event.Records) {
    // S3 keys are URL encoded
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    // Get bucket name from event (fallback if env var missing)
    const eventBucketName = record.s3.bucket.name;
    const bucketToUse = BUCKET_NAME || eventBucketName;
    
    console.log(`Using bucket: ${bucketToUse} (from ${BUCKET_NAME ? 'env' : 'event'})`);
    
    // Expected key format: uploads/{userId}/{reportId}.mp4
    const parts = key.split('/');
    if (parts.length !== 3 || parts[0] !== 'uploads') {
      console.log('Skipping key:', key);
      continue;
    }
    
    const userId = parts[1];
    const reportId = path.basename(parts[2], '.mp4'); // removes extension
    
    try {
      console.log(`Processing ${key} for user ${userId} from bucket ${bucketToUse}`);
      
      const localInput = `/tmp/${reportId}.mp4`;
      const outputDir = `/tmp/frames-${reportId}`;
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      // 1. Download Video
      const getCommand = new GetObjectCommand({
        Bucket: bucketToUse,
        Key: key,
      });
      const response = await s3.send(getCommand);
      if (!response.Body) throw new Error('No body in S3 response');
      
      await pipeline(response.Body as any, fs.createWriteStream(localInput));
      console.log('Video downloaded');
      
      // 2. Extract Frames (1 frame per second)
      // We need to point to the ffmpeg binary if it's in a layer
      // Usually layers put it in /opt/bin/ffmpeg
      if (fs.existsSync('/opt/bin/ffmpeg')) {
        ffmpeg.setFfmpegPath('/opt/bin/ffmpeg');
      }
      
      await new Promise((resolve, reject) => {
        ffmpeg(localInput)
          .outputOptions('-vf', 'fps=1') // 1 frame per second
          .output(`${outputDir}/frame_%03d.jpg`)
          .on('end', resolve)
          .on('error', (err: any) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .run();
      });
      
      console.log('Frames extracted');
      
      // 3. Generate and Upload Thumbnail (first frame)
      const files = fs.readdirSync(outputDir);
      files.sort();
      let thumbnailUrl = null;
      
      if (files.length > 0) {
        const firstFrame = files[0];
        const thumbnailKey = `thumbnails/${userId}/${reportId}.jpg`;
        const thumbnailStream = fs.createReadStream(path.join(outputDir, firstFrame));
        
        await s3.send(new PutObjectCommand({
          Bucket: bucketToUse,
          Key: thumbnailKey,
          Body: thumbnailStream,
          ContentType: 'image/jpeg',
        }));
        
        // Generate presigned URL for thumbnail
        const thumbnailCommand = new GetObjectCommand({
          Bucket: bucketToUse,
          Key: thumbnailKey,
        });
        thumbnailUrl = await getSignedUrl(s3, thumbnailCommand, { expiresIn: 604800 }); // 1 week (max allowed)
        
        console.log('Thumbnail uploaded and URL generated');
        
        // Update database with thumbnail URL
        if (TABLE_NAME) {
          try {
            await docClient.send(new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { userId, reportId },
              UpdateExpression: 'SET thumbnailUrl = :t, processingStatus = :s',
              ExpressionAttributeValues: {
                ':t': thumbnailUrl,
                ':s': 'PROCESSING',
              },
            }));
            console.log('Database updated with thumbnail URL');
          } catch (dbError) {
            console.error('Error updating database with thumbnail:', dbError);
          }
        }
      }
      
      // 4. Upload All Frames
      const frameKeys: string[] = [];
      
      for (const file of files) {
        const fileStream = fs.createReadStream(path.join(outputDir, file));
        const frameKey = `frames/${userId}/${reportId}/${file}`;
        
        await s3.send(new PutObjectCommand({
          Bucket: bucketToUse,
          Key: frameKey,
          Body: fileStream,
          ContentType: 'image/jpeg',
        }));
        
        frameKeys.push(frameKey);
      }
      
      console.log(`Uploaded ${frameKeys.length} frames`);
      
      // 5. Update database with frame URLs and status
      if (TABLE_NAME) {
        try {
          await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
            UpdateExpression: 'SET frameUrls = :f, processingStatus = :s',
            ExpressionAttributeValues: {
              ':f': frameKeys,
              ':s': 'PROCESSING',
            },
          }));
          console.log('Database updated with frame URLs');
        } catch (dbError) {
          console.error('Error updating database with frame URLs:', dbError);
        }
      }
      
      // 6. Cleanup
      try {
        fs.unlinkSync(localInput);
        fs.rmSync(outputDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }
      
      // 7. Invoke AI Analysis
      try {
        console.log(`Invoking AI Analysis function: ${AI_FUNCTION_NAME}`);
        console.log(`Payload: ${JSON.stringify({ userId, reportId, frameKeys: frameKeys.length })}`);
        
        const invokeResponse = await lambda.send(new InvokeCommand({
          FunctionName: AI_FUNCTION_NAME,
          InvocationType: 'Event', // Async
          Payload: JSON.stringify({
            userId,
            reportId,
            frameKeys,
          }),
        }));
        
        console.log('AI Analysis invoked successfully', {
          statusCode: invokeResponse.StatusCode,
          functionError: invokeResponse.FunctionError,
        });
      } catch (invokeError) {
        console.error('Error invoking AI Analysis:', invokeError);
        // Update status to FAILED if we can't invoke
        if (TABLE_NAME) {
          try {
            await docClient.send(new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { userId, reportId },
              UpdateExpression: 'SET processingStatus = :s',
              ExpressionAttributeValues: { ':s': 'FAILED' },
            }));
          } catch (dbError) {
            console.error('Error updating status to FAILED:', dbError);
          }
        }
      }
    } catch (error: any) {
      console.error('Error processing video:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // Update DB status to FAILED
      if (TABLE_NAME && userId && reportId) {
        try {
          await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
            UpdateExpression: 'SET processingStatus = :s',
            ExpressionAttributeValues: { ':s': 'FAILED' },
          }));
          console.log('Database updated with FAILED status');
        } catch (dbError) {
          console.error('Error updating database with FAILED status:', dbError);
        }
      }
    }
  }
};

