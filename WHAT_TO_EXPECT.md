# What to Expect After Adding S3 Trigger

Now that the S3 trigger is configured, here's what should happen:

## The Pipeline Flow

1. **Upload Video** ✅
   - Video uploads to S3 `uploads/{userId}/{reportId}.mp4`
   - Report created in DynamoDB with status `UPLOADING`

2. **S3 Trigger Fires** ✅ (This was missing before!)
   - S3 detects new file in `uploads/` folder
   - Automatically invokes `frame-extractor-lambda`

3. **Frame Extraction** (1-2 minutes)
   - Function downloads video from S3
   - Uses FFmpeg to extract 1 frame per second
   - Uploads frames to S3 `frames/{userId}/{reportId}/frame_001.jpg`, etc.
   - Invokes `ai-analysis-lambda`

4. **AI Analysis** (30-60 seconds)
   - Downloads frames from S3
   - Calls OpenAI API with frames
   - Generates coaching report
   - Updates DynamoDB with:
     - `processingStatus`: `COMPLETED`
     - `aiReportMarkdown`: The full report
     - `frameUrls`: Array of frame S3 keys

5. **Frontend Updates** ✅
   - Frontend polling detects `COMPLETED` status
   - Shows the AI-generated report!

## How to Monitor

### CloudWatch Logs (Best way to see progress)

**frame-extractor logs:**
- https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
- Search for: `frame-extractor`
- Look for:
  - "Event received" = Trigger fired ✅
  - "Video downloaded" = Got the video ✅
  - "Frames extracted" = FFmpeg worked! ✅
  - "Uploaded X frames" = Frames in S3 ✅
  - "Invoked AI Analysis" = Next step started ✅

**ai-analysis logs:**
- Search for: `ai-analysis`
- Look for:
  - "Starting analysis" = Got the frames ✅
  - "OpenAI API call" = Calling AI ✅
  - "Report generated" = Done! ✅

### DynamoDB (Check status)

- https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables
- Find your report
- Watch `processingStatus` change:
  - `UPLOADING` → `PROCESSING` → `COMPLETED`

### S3 (See the files)

- https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2
- Check:
  - `uploads/` = Your video ✅
  - `frames/` = Extracted frames (should appear after frame-extractor runs)

## Timeline

- **Upload:** ~10-30 seconds (depending on file size)
- **Frame extraction:** ~1-2 minutes (60-second video = ~60 frames)
- **AI analysis:** ~30-60 seconds
- **Total:** ~2-3 minutes for a 60-second clip

## If It's Still Spinning

1. **Check CloudWatch logs** - See where it's stuck
2. **Check DynamoDB status** - What's the current status?
3. **Check S3** - Are frames being created?
4. **Check for errors** - Any error messages in logs?

## Success Indicators

You'll know it's working when:
- ✅ CloudWatch shows "Frames extracted"
- ✅ Frames appear in S3 `frames/` folder
- ✅ DynamoDB status changes to `COMPLETED`
- ✅ Frontend shows the report!

Good luck! 🚀

