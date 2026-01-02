# Debug: AI Analysis Not Being Invoked

If `ai-analysis` isn't in the logs, it means `frame-extractor` didn't successfully invoke it.

## Step 1: Check frame-extractor Logs

**Look for these messages in order:**
1. ✅ "Video downloaded"
2. ✅ "Frames extracted"
3. ✅ "Uploaded X frames"
4. ❓ "Invoked AI Analysis" ← **Check if this appears**

**If you DON'T see "Invoked AI Analysis":**
- The code didn't reach that point
- Check for errors after "Uploaded X frames"
- There might be an error in the cleanup or invocation code

**If you DO see "Invoked AI Analysis":**
- The invocation was attempted
- But it might have failed silently
- Check Step 2

## Step 2: Verify AI_FUNCTION_NAME

**The function name must be EXACT:**

1. **Go to Lambda Console:**
   - Search for: `ai-analysis`
   - Click on the function
   - **Copy the EXACT function name** from the top

2. **Go to frame-extractor-lambda:**
   - Configuration → Environment variables
   - Check `AI_FUNCTION_NAME`
   - **Must match EXACTLY** (case-sensitive, no extra spaces)

**Common mistakes:**
- Wrong function name pattern
- Extra characters or spaces
- Missing parts of the name

## Step 3: Check Lambda Invoke Permission

**frame-extractor needs permission to invoke ai-analysis:**

1. Go to frame-extractor-lambda function
2. Configuration → Permissions
3. Click Execution role
4. **Should have a policy allowing:**
   - `lambda:InvokeFunction`
   - On the ai-analysis function ARN

**If missing:**
- Add it (we should have done this earlier, but might be missing)

## Step 4: Check for Errors

**In frame-extractor logs, look for:**
- Any errors after "Uploaded X frames"
- Lambda invocation errors
- Permission denied errors

## Quick Test: Manual Invocation

**Test if ai-analysis works when called directly:**

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
4. Replace with actual frame paths from S3
5. Click "Test"
6. Check if it works

**If this works:**
- The function is fine
- The issue is with the invocation from frame-extractor

**If this fails:**
- Check environment variables
- Check IAM permissions
- Check OpenAI API key

---

## Most Likely Issues

1. **Wrong function name** - Check AI_FUNCTION_NAME matches exactly
2. **Missing invoke permission** - frame-extractor can't call ai-analysis
3. **Error before invocation** - Check frame-extractor logs for errors
4. **Function name format** - Might need full ARN instead of just name

**Check the frame-extractor logs first - do you see "Invoked AI Analysis"?**

