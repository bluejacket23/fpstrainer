# Manually Trigger frame-extractor Function

Since the videos were uploaded before the trigger was configured, let's manually trigger the function to process them.

## Step 1: Go to Lambda Function

1. **Go to Lambda Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Find: `frame-extractor-lambda`
   - Click on it

## Step 2: Create Test Event

1. **Click "Test" tab**
2. **Click "Create new event"** (or "Edit" if one exists)
3. **Event name:** `test-s3-trigger`
4. **Event JSON:** Paste this (replace with your actual reportId):

```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-2",
      "eventTime": "2025-11-23T02:32:47.000Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "AWS:AROA54WIF74DCANRSE6GT:test"
      },
      "requestParameters": {
        "sourceIPAddress": "127.0.0.1"
      },
      "responseElements": {
        "x-amz-request-id": "TEST123",
        "x-amz-id-2": "TEST456"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "test-config",
        "bucket": {
          "name": "amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom",
          "ownerIdentity": {
            "principalId": "A4332XDRPAQ3S"
          },
          "arn": "arn:aws:s3:::amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom"
        },
        "object": {
          "key": "uploads/311b85e0-40c1-7092-5f38-01eb6ad4ebed/291229b6-8a5e-45d5-aabf-edd90319f31d.mp4",
          "size": 104413121,
          "eTag": "4e9fa67230dd502cc9ab1b4f35fa00d6",
          "sequencer": "TEST789"
        }
      }
    }
  ]
}
```

5. **Click "Save"**

## Step 3: Run the Test

1. **Click "Test" button**
2. **Wait for execution** (may take 1-2 minutes for frame extraction)
3. **Check the response:**
   - Should show "Success" or execution result
   - Check for any errors

## Step 4: Check CloudWatch Logs

1. **Go to CloudWatch Logs:**
   - https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
   - Search for: `frame-extractor`
   - Click on the most recent log stream
   - **Look for:**
     - "Event received" ✅
     - "Video downloaded" ✅
     - "Frames extracted" ✅ (this means FFmpeg worked!)
     - "Uploaded X frames" ✅
     - "Invoked AI Analysis" ✅

## Step 5: Check Results

**After the function runs:**

1. **Check S3 for frames:**
   - Go to: `frames/311b85e0-40c1-7092-5f38-01eb6ad4ebed/291229b6-8a5e-45d5-aabf-edd90319f31d/`
   - Should see multiple JPG files (frames)

2. **Check DynamoDB:**
   - Find report: `291229b6-8a5e-45d5-aabf-edd90319f31d`
   - Status should change to `COMPLETED` (after AI analysis)
   - Should have `frameUrls` and `aiReportMarkdown`

3. **Check frontend:**
   - Go to: http://localhost:3000/report/291229b6-8a5e-45d5-aabf-edd90319f31d
   - Should show the report!

## If It Works

**Great!** The function works. For future uploads:
- Upload a NEW video through the frontend
- The S3 trigger will fire automatically
- Processing will happen automatically

## If It Fails

**Check CloudWatch logs for errors:**
- Missing permissions? (Add IAM policies)
- FFmpeg not found? (Check layer is attached)
- Other errors? (Fix based on error message)

---

**This will test if the entire pipeline works!** 🚀

