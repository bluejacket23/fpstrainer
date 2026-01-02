# Test If Your OpenAI Key Works

Since secrets are masked, here's how to verify it's working:

## Quick Test: Upload a Video

**The easiest way to verify:**

1. **Upload a new video** through your frontend
2. **Watch CloudWatch logs** for `ai-analysis-lambda`
3. **Check the result:**

### ✅ If Key is Correct:
- Logs show: "Starting analysis for {reportId}"
- Logs show: OpenAI API calls succeeding
- Logs show: "Report generated successfully"
- DynamoDB status changes to: `COMPLETED`
- Frontend shows the AI-generated report!

### ❌ If Key is Wrong:
- Logs show: "401 Incorrect API key provided"
- Error message about invalid API key
- Status stays as `UPLOADING` or `PROCESSING`
- No report generated

## Alternative: Check Lambda Environment Variable

**Go to ai-analysis-lambda function:**
- Configuration → Environment variables
- **Look for `OPENAI_API_KEY`:**
  - ✅ If it's there: Function can access it
  - ❌ If it's missing: Add it manually

**If it's there but masked:**
- That's fine! The function can still use it
- The masking is just for display

## Manual Function Test

**Test the function directly:**

1. Go to `ai-analysis-lambda` → Test tab
2. Create test event:
```json
{
  "userId": "test-user",
  "reportId": "test-report",
  "frameKeys": [
    "frames/test/test/frame_001.jpg"
  ]
}
```
3. Click "Test"
4. **Check the response:**
   - ✅ Success = Key works!
   - ❌ "401 Incorrect API key" = Key is wrong

## Bottom Line

**The secret IS set** (it's in the list: `- OPENAI_API_KEY`)

**To verify it works:**
- Upload a video and see if AI analysis completes
- Or test the function manually
- If you get "401 Incorrect API key", then update the key
- If AI analysis works, the key is correct! ✅

---

**Don't worry about the masking - test it and you'll know if it works!** 🚀

