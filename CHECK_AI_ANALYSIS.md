# Check AI Analysis Function

Frames are extracted ✅, but status is still "UPLOADING". This means `ai-analysis` might not be running.

## Step 1: Check if ai-analysis Was Invoked

**In CloudWatch Logs:**
1. Search for: `ai-analysis`
2. Look for recent log streams (from last few minutes)
3. **If you see logs:**
   - Check for "Starting analysis for {reportId}"
   - Check for any errors
4. **If NO logs exist:**
   - Function wasn't invoked
   - Check Step 2

## Step 2: Check frame-extractor Logs

**Look for:**
- "Invoked AI Analysis" message
- This confirms frame-extractor tried to call ai-analysis

**If you DON'T see this message:**
- frame-extractor might have failed before invoking
- Check for errors in frame-extractor logs

## Step 3: Check ai-analysis Environment Variables

**Go to ai-analysis-lambda function:**
1. Configuration → Environment variables
2. **Should have:**
   - `TABLE_NAME` = `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
   - `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - `OPENAI_API_KEY` = (should be from secrets)

**If missing:**
- Add them
- The function needs these to work

## Step 4: Check ai-analysis IAM Permissions

**The function needs:**
- DynamoDB UpdateItem permission
- S3 GetObject permission

**Check:**
1. Go to ai-analysis-lambda function
2. Configuration → Permissions
3. Click Execution role
4. **Should have policies for:**
   - DynamoDB (UpdateItem)
   - S3 (GetObject)

**If missing:**
- Add them (similar to what we did for other functions)

## Step 5: Manual Test

**If nothing is working, test ai-analysis manually:**

1. Go to ai-analysis-lambda function
2. Click "Test" tab
3. Create test event:
```json
{
  "userId": "311b85e0-40c1-7092-5f38-01eb6ad4ebed",
  "reportId": "7de45394-5b89-4ac5-bec9-155a698057bf",
  "frameKeys": [
    "frames/311b85e0-40c1-7092-5f38-01eb6ad4ebed/7de45394-5b89-4ac5-bec9-155a698057bf/frame_001.jpg",
    "frames/311b85e0-40c1-7092-5f38-01eb6ad4ebed/7de45394-5b89-4ac5-bec9-155a698057bf/frame_002.jpg"
  ]
}
```
4. Replace `frameKeys` with actual frame paths from S3
5. Click "Test"
6. Check response and logs

## Most Likely Issues

1. **ai-analysis not invoked** - Check frame-extractor logs for "Invoked AI Analysis"
2. **Missing environment variables** - TABLE_NAME, BUCKET_NAME, OPENAI_API_KEY
3. **Missing IAM permissions** - Can't update DynamoDB or read S3
4. **OpenAI API key missing** - Check if secret is set

## Quick Fix Checklist

- [ ] Check CloudWatch logs for ai-analysis
- [ ] Verify environment variables are set
- [ ] Verify IAM permissions are added
- [ ] Check if OPENAI_API_KEY is accessible
- [ ] Test function manually if needed

---

**Check the CloudWatch logs first - that will tell us what's wrong!**

