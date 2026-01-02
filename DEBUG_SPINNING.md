# Debug: Upload Spinning Forever

The upload succeeded (no errors!), but it's stuck spinning. This usually means:

1. ✅ Video uploaded to S3 successfully
2. ❓ S3 trigger may not be configured (frame-extractor not running)
3. ❓ Frame-extractor is running but taking a long time
4. ❓ Frontend is polling but report status isn't updating

## Step 1: Check if Video Actually Uploaded

**Go to S3 Console:**
- https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2&prefix=uploads/

**Look for:**
- Your video file in `uploads/{userId}/{reportId}.mp4`
- If it's there, upload worked! ✅

## Step 2: Check S3 Trigger

**The frame-extractor function needs to be triggered when video is uploaded.**

1. **Go to frame-extractor-lambda function:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `frame-extractor`

2. **Check Configuration → Triggers:**
   - Should see an **S3 trigger** for:
     - Bucket: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
     - Prefix: `uploads/`
     - Suffix: `.mp4`

**If trigger is MISSING:**
- Add it manually (see "Add S3 Trigger" section below)

## Step 3: Check CloudWatch Logs

**Check if frame-extractor ran:**

1. **Go to CloudWatch Logs:**
   - https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
   - Search for: `frame-extractor`

2. **Look for recent log streams:**
   - If you see a recent stream, click it
   - Look for:
     - "Event received" - means function was triggered
     - "Video downloaded" - means it got the video
     - "Frames extracted" - means FFmpeg worked! ✅
     - Any errors

**If NO logs exist:**
- S3 trigger is probably not configured

## Step 4: Check Frontend Polling

The frontend is probably polling for report status. Check:

1. **Open browser DevTools (F12)**
2. **Network tab** - see what GraphQL queries are being made
3. **Console tab** - see if there are any errors

The frontend is likely calling `getReportCustom` repeatedly waiting for `processingStatus` to change from `UPLOADING` to `COMPLETED`.

## Step 5: Check DynamoDB

**See what status the report has:**

1. **Go to DynamoDB Console:**
   - https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables
   - Click on: `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
   - Click "Explore table items"
   - Find your report (by `reportId` or `userId`)
   - Check `processingStatus` field:
     - `UPLOADING` = Video uploaded, waiting for processing
     - `PROCESSING` = Frame extraction in progress
     - `COMPLETED` = Done! (frontend should show it)
     - `FAILED` = Something went wrong

---

## Add S3 Trigger (If Missing)

**If Step 2 showed no trigger, add it:**

1. **Go to frame-extractor-lambda function**
2. **Configuration → Triggers**
3. **Click "Add trigger"**
4. **Select "S3"**
5. **Configure:**
   - **Bucket:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - **Event type:** `All object create events`
   - **Prefix:** `uploads/`
   - **Suffix:** `.mp4`
6. **Check "Recursive invocation"** (if shown)
7. **Click "Add"**

**After adding trigger:**
- Upload a new video (or manually trigger by uploading a test file to S3)

---

## Quick Checks Summary

1. ✅ Video in S3? → Upload worked
2. ✅ S3 trigger configured? → Frame-extractor will run
3. ✅ CloudWatch logs show activity? → Function is running
4. ✅ DynamoDB status? → See where it's stuck

**Most likely issue:** S3 trigger not configured, so frame-extractor never runs.

---

## If Frame-Extractor is Running But Slow

FFmpeg processing can take time:
- 60-second video = ~60 frames to extract
- Each frame needs to be uploaded to S3
- Then AI analysis needs to run

**Check CloudWatch logs** to see progress. Look for:
- "Frames extracted" = FFmpeg done
- "Uploaded X frames" = Frames uploaded to S3
- "Invoked AI Analysis" = Next step started

If you see these messages, it's just taking time. Be patient! ⏳

