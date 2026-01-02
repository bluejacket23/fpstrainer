# Debug: Still Spinning After Permissions Added

If it's still spinning, let's check each step:

## Step 1: Check CloudWatch Logs

**frame-extractor logs:**
- https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
- Search for: `frame-extractor`
- **Look for:**
  - Recent log streams (should be from last few minutes)
  - "Event received" = Trigger fired ✅
  - "Video downloaded" = Got the video ✅
  - "Frames extracted" = FFmpeg worked! ✅
  - Any errors

**If NO logs exist:**
- S3 trigger might not be firing
- Check Step 2

**If logs show errors:**
- Check the error message
- Common: Missing permissions, FFmpeg not found, etc.

## Step 2: Verify S3 Trigger

1. **Go to frame-extractor-lambda function**
2. **Configuration → Triggers**
3. **Should see:**
   - S3 trigger
   - Bucket: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - Prefix: `uploads/`
   - Suffix: `.mp4`
   - Status: Enabled

**If trigger is missing or disabled:**
- Re-add it (see previous instructions)

## Step 3: Check if Video Uploaded

**Go to S3:**
- https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2&prefix=uploads/

**Look for:**
- Your latest video file
- Should be in `uploads/{userId}/{reportId}.mp4`
- Check the timestamp - should be recent

**If video is there:**
- Upload worked ✅
- Trigger should fire automatically

**If video is NOT there:**
- Upload might have failed
- Check browser console for errors

## Step 4: Check DynamoDB Status

**Go to DynamoDB:**
- https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables
- Click: `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
- Click "Explore table items"
- Find your latest report (sort by timestamp)
- Check `processingStatus`:
  - `UPLOADING` = Video uploaded, waiting for processing
  - `PROCESSING` = Frame extraction in progress
  - `COMPLETED` = Done! (frontend should show it)
  - `FAILED` = Something went wrong

## Step 5: Manual Trigger Test

**If trigger isn't firing, test manually:**

1. **Go to frame-extractor-lambda function**
2. **Click "Test" tab**
3. **Create test event:**
```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-2",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "bucket": {
          "name": "amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom"
        },
        "object": {
          "key": "uploads/YOUR_USER_ID/YOUR_REPORT_ID.mp4"
        }
      }
    }
  ]
}
```
4. **Replace YOUR_USER_ID and YOUR_REPORT_ID** with actual values from S3
5. **Click "Test"**
6. **Check the response and logs**

## Common Issues

### No CloudWatch Logs
- **Cause:** S3 trigger not firing
- **Fix:** Re-add S3 trigger, or test manually

### Logs Show "AccessDenied"
- **Cause:** Permissions not set correctly
- **Fix:** Double-check IAM policies were added

### Logs Show "FFmpeg not found"
- **Cause:** FFmpeg layer not attached
- **Fix:** Verify layer is attached to function

### Logs Show "Video downloaded" but nothing else
- **Cause:** FFmpeg extraction failing
- **Fix:** Check FFmpeg layer, check memory/timeout settings

### Status Stuck at "UPLOADING"
- **Cause:** Frame-extractor never ran or failed silently
- **Fix:** Check CloudWatch logs for errors

## Quick Checklist

- [ ] Video is in S3 `uploads/` folder
- [ ] S3 trigger is configured and enabled
- [ ] CloudWatch logs show frame-extractor was invoked
- [ ] No errors in CloudWatch logs
- [ ] DynamoDB status is updating
- [ ] FFmpeg layer is attached
- [ ] Environment variables are set
- [ ] IAM permissions are added

---

**Most likely issue:** S3 trigger not firing, or function failing silently. Check CloudWatch logs first!

