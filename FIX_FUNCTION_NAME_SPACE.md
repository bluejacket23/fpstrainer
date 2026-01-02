# Fix: Leading Space in Function Name

## The Problem

The `AI_FUNCTION_NAME` environment variable has a **leading space**:
```
 amplify-opscoach-lukec-sa-aianalysislambdaFD152DDF-yHCugvWSyfhp
^
(space here!)
```

Lambda function names can't have leading spaces, which is why the invocation is failing.

## The Fix

1. **Go to frame-extractor-lambda function:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Find: `frame-extractor-lambda`

2. **Edit Environment Variable:**
   - Click **"Configuration"** tab
   - Click **"Environment variables"** in left sidebar
   - Click **"Edit"**
   - Find `AI_FUNCTION_NAME`
   - **Remove the leading space**
   - Should be: `amplify-opscoach-lukec-sa-aianalysislambdaFD152DDF-yHCugvWSyfhp`
   - (No space at the beginning!)

3. **Save**

4. **Test again:**
   - Upload a new video, or
   - Manually trigger frame-extractor again

## After Fixing

The function name should be:
```
amplify-opscoach-lukec-sa-aianalysislambdaFD152DDF-yHCugvWSyfhp
```

(No leading space!)

Once fixed, the invocation should work and you should see:
- ✅ "Invoked AI Analysis" in frame-extractor logs
- ✅ ai-analysis logs appearing in CloudWatch
- ✅ Status updating in DynamoDB
- ✅ Report appearing in frontend!

---

**This is a simple typo - just remove the space!** 🚀

