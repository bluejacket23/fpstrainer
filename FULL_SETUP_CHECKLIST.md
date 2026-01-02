# Complete Setup Checklist - FFmpeg + OpenAI Pipeline

Follow these steps in order to get the full video upload → frame extraction → AI analysis pipeline working.

## ✅ Step 1: Add FFmpeg Layer (2 minutes)

**AWS Lambda Console should already be open. If not:**
- Go to: https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions

**Steps:**
1. Search for: `frame-extractor`
2. Click on the function: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`
3. Scroll to **"Layers"** section
4. Click **"Add a layer"**
5. Choose **"Specify an ARN"**
6. Enter: `arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4`
7. Click **"Add"**

**If that ARN doesn't work:**
- Try **"AWS layers"** → search for "ffmpeg"
- Or try a different region's ARN (us-east-1, us-west-2)

---

## ✅ Step 2: Find DynamoDB Table Name (1 minute)

**Go to DynamoDB Console:**
- https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables

**Find the table:**
- Look for a table starting with `OpsCoachReport-`
- The full name will be something like: `OpsCoachReport-<API_ID>-NONE`
- **Copy this exact name** - you'll need it for Step 3

---

## ✅ Step 3: Set Environment Variables (5 minutes)

**For each Lambda function, add these environment variables:**

### Function 1: `upload-init-lambda`
- `TABLE_NAME` = (the table name from Step 2)
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

### Function 2: `get-report-lambda`
- `TABLE_NAME` = (the table name from Step 2)

### Function 3: `ai-analysis-lambda`
- `TABLE_NAME` = (the table name from Step 2)
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
- `OPENAI_API_KEY` = (already set from secrets - verify it's there)

### Function 4: `frame-extractor-lambda`
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
- `AI_FUNCTION_NAME` = `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`

**How to add:**
1. In Lambda Console, click each function
2. Go to **"Configuration"** → **"Environment variables"**
3. Click **"Edit"** → **"Add environment variable"**
4. Add each variable listed above
5. Click **"Save"**

---

## ✅ Step 4: Verify S3 Trigger (1 minute)

**Check that frame-extractor triggers on video uploads:**

1. Go to `frame-extractor-lambda` function
2. Check **"Configuration"** → **"Triggers"**
3. Should see an **S3 trigger** for bucket: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
4. Prefix: `uploads/`
5. Suffix: `.mp4`

**If trigger is missing:**
- We'll need to add it manually or wire it up in `amplify/backend.ts` (currently commented out)

---

## ✅ Step 5: Test the Full Pipeline

**1. Start Frontend (if not running):**
```bash
npm run dev
```

**2. Login:**
- Go to http://localhost:3000/login
- Sign up or log in with your email

**3. Upload a Video:**
- Upload a short MP4 video (10-60 seconds recommended)
- Watch the processing status

**4. Check Processing:**
- **CloudWatch Logs** for each function:
  - `upload-init-lambda` - should create DB record and return presigned URL
  - `frame-extractor-lambda` - should extract frames (check for FFmpeg usage)
  - `ai-analysis-lambda` - should call OpenAI and generate report
  - `get-report-lambda` - should return the final report

**5. View Report:**
- The report should appear in your dashboard
- Should include AI-generated analysis

---

## 🔍 Troubleshooting

### "FFmpeg not found" error
- Verify FFmpeg layer is attached (Step 1)
- Check CloudWatch logs for exact error
- Try a different FFmpeg layer ARN

### "Missing environment variable" error
- Double-check all environment variables are set (Step 3)
- Verify table name is correct (Step 2)

### "OpenAI API key missing" error
- Verify secret is set: `npx ampx sandbox secret list`
- Check `ai-analysis-lambda` has access to the secret

### Video uploads but nothing happens
- Check S3 trigger is configured (Step 4)
- Check CloudWatch logs for `frame-extractor-lambda`
- Verify `BUCKET_NAME` environment variable is correct

### Frames extracted but no AI analysis
- Check `AI_FUNCTION_NAME` environment variable in `frame-extractor-lambda`
- Check CloudWatch logs for `ai-analysis-lambda`
- Verify OpenAI API key is set

---

## 📝 Quick Verification Commands

**Check if everything is configured:**
```bash
# List all Lambda functions
aws lambda list-functions --region us-east-2 --query "Functions[?contains(FunctionName, 'opscoach')].FunctionName"

# Check environment variables for a function
aws lambda get-function-configuration --function-name amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda --region us-east-2 --query "Environment.Variables"

# Check layers for frame-extractor
aws lambda get-function-configuration --function-name amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda --region us-east-2 --query "Layers"
```

---

## 🎯 Success Criteria

You'll know everything is working when:
1. ✅ Video uploads successfully
2. ✅ Frames are extracted (check S3 `frames/` folder)
3. ✅ AI analysis completes (check DynamoDB for `aiReportMarkdown`)
4. ✅ Report appears in frontend dashboard

Good luck! 🚀

