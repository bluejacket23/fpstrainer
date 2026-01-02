# Debug: No CloudWatch Logs for ai-analysis

If you don't see logs, let's check where the pipeline is stuck.

## Step 1: Did You Upload a NEW Video?

**Important:** S3 triggers only fire on NEW uploads!

- ✅ Upload a **new video** through the frontend
- ❌ Old videos won't trigger again

## Step 2: Check frame-extractor Logs

**Go to CloudWatch → Search for `frame-extractor`**

**Look for these messages in order:**
1. ✅ "Video downloaded"
2. ✅ "Frames extracted"
3. ✅ "Uploaded X frames"
4. ❓ **"Invoked AI Analysis"** ← **Check if this appears**

**If you DON'T see "Invoked AI Analysis":**
- frame-extractor didn't try to call ai-analysis
- Check for errors after "Uploaded X frames"
- Check if `AI_FUNCTION_NAME` is still set correctly

**If you DO see "Invoked AI Analysis":**
- The invocation was attempted
- Check Step 3

## Step 3: Check DynamoDB Status

**Go to DynamoDB:**
- Find your latest report
- Check `processingStatus`:
  - `UPLOADING` = Video uploaded, waiting for frame-extractor
  - `PROCESSING` = Frame extraction or AI analysis in progress
  - `COMPLETED` = Done! (check frontend)
  - `FAILED` = Something went wrong

## Step 4: Search CloudWatch Correctly

**Don't just browse - actually search:**

1. Go to CloudWatch Logs
2. Click the search box at the top
3. Type: `ai-analysis`
4. Press Enter
5. **Look for log groups** that match

**Or go directly to:**
- Search for: `/aws/lambda/amplify-opscoach-lukec-sa-aianalysislambda...`
- Or search for any log group containing "ai-analysis"

## Step 5: Check Function Was Invoked

**If you see NO logs at all:**

1. **Check if the function exists:**
   - Go to Lambda Console
   - Search for `ai-analysis`
   - Does the function exist?

2. **Check if it was invoked:**
   - Go to the function
   - Click "Monitor" tab
   - Check "Invocations" - should show recent invocations
   - If it shows 0, the function wasn't called

3. **Check frame-extractor logs:**
   - Did frame-extractor successfully invoke it?
   - Any errors in the invocation?

## Most Likely Issues

1. **Didn't upload a new video** - Old videos won't trigger
2. **frame-extractor didn't invoke** - Check frame-extractor logs
3. **Function name wrong** - Check `AI_FUNCTION_NAME` env var
4. **Looking in wrong place** - Make sure you're searching, not just browsing

---

## Quick Checklist

- [ ] Uploaded a NEW video (not an old one)
- [ ] Checked frame-extractor logs for "Invoked AI Analysis"
- [ ] Checked DynamoDB status
- [ ] Searched CloudWatch for "ai-analysis" (not just browsed)
- [ ] Checked Lambda function "Monitor" tab for invocations

**What do you see in frame-extractor logs after "Uploaded X frames"?**

