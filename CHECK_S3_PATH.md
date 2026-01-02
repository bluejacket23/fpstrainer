# Check S3 Path Structure

The S3 trigger requires files to be in the `uploads/` prefix. Let's verify the path.

## Check the Full S3 Path

**In S3 Console, check the full path of your video:**

1. Go to: https://console.aws.amazon.com/s3/buckets/amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom?region=us-east-2
2. Navigate to your video file
3. **Check the full path** - it should be:
   - ✅ `uploads/311b85e0-40c1-7092-5f38-01eb6ad4ebed/{reportId}.mp4`
   - ❌ `311b85e0-40c1-7092-5f38-01eb6ad4ebed/{reportId}.mp4` (missing uploads/ prefix)

**If the path is missing `uploads/` prefix:**
- The trigger won't fire!
- The videos need to be in `uploads/` folder

## If Videos Are in Wrong Location

**Option 1: Move them manually (quick test)**
1. In S3, select the video
2. Click "Actions" → "Move"
3. Move to: `uploads/311b85e0-40c1-7092-5f38-01eb6ad4ebed/`
4. This should trigger the function!

**Option 2: Fix the upload path (proper fix)**
- The `upload-init` handler should create path: `uploads/${userId}/${reportId}.mp4`
- If it's not doing that, we need to check the handler

## Check S3 Trigger Configuration

**Verify the trigger settings:**
1. Go to `frame-extractor-lambda` function
2. Configuration → Triggers
3. Click on the S3 trigger
4. **Check:**
   - Prefix: `uploads/` ✅
   - Suffix: `.mp4` ✅
   - Event types: `s3:ObjectCreated:*` ✅

**If prefix is wrong or missing:**
- Delete the trigger
- Re-add it with prefix: `uploads/`

## Test the Trigger Manually

**If path is correct but trigger still not firing:**

1. Go to `frame-extractor-lambda` function
2. Click "Test" tab
3. Create test event with your actual video path:
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
          "key": "uploads/311b85e0-40c1-7092-5f38-01eb6ad4ebed/e2aea6da-4cee-4e6b-bd09-75c48cd323b1.mp4"
        }
      }
    }
  ]
}
```
4. Replace with your actual reportId
5. Click "Test"
6. Check CloudWatch logs

## Most Likely Issue

**The videos are probably NOT in the `uploads/` prefix!**

Check the full S3 path - if it doesn't start with `uploads/`, that's why the trigger isn't firing.

