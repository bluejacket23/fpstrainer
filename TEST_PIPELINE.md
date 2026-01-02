# Test the Full Video Processing Pipeline

Now that FFmpeg layer is added, let's test everything!

## ✅ Pre-Flight Checklist

Before testing, make sure:

1. **FFmpeg Layer** ✅ (You just added this!)
2. **Environment Variables** - Need to verify these are set
3. **S3 Trigger** - Should be auto-configured, but let's verify
4. **Frontend Running** - Start the dev server
5. **OpenAI API Key** - Should already be set from secrets

## Step 1: Verify Environment Variables

**Quick check via AWS Console:**

Go to each Lambda function and verify these environment variables are set:

### upload-init-lambda
- `TABLE_NAME` = (your DynamoDB table name)
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

### get-report-lambda
- `TABLE_NAME` = (your DynamoDB table name)

### ai-analysis-lambda
- `TABLE_NAME` = (your DynamoDB table name)
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
- `OPENAI_API_KEY` = (should be from secrets)

### frame-extractor-lambda
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
- `AI_FUNCTION_NAME` = `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`

**To find your table name:**
- Go to DynamoDB Console: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables
- Look for table starting with `OpsCoachReport-`
- Copy the full name

## Step 2: Verify S3 Trigger

1. Go to `frame-extractor-lambda` function
2. Check **"Configuration"** → **"Triggers"**
3. Should see an S3 trigger for:
   - Bucket: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - Prefix: `uploads/`
   - Suffix: `.mp4`

**If trigger is missing:** We'll need to add it manually or wire it up in code.

## Step 3: Start Frontend

**In a new terminal:**
```bash
npm run dev
```

Wait for: `Ready - started server on 0.0.0.0:3000`

## Step 4: Test Video Upload

1. **Open browser:** http://localhost:3000/login
2. **Sign up/Login** with your email
3. **Upload a video:**
   - Click upload button
   - Select an MP4 file (10-60 seconds recommended)
   - Wait for upload to complete

4. **Watch the magic happen!** 🎬

## Step 5: Monitor Processing

**Open CloudWatch Logs to watch each step:**

### 1. upload-init-lambda
- Should create DB record
- Should return presigned URL
- Status: `UPLOADING`

### 2. frame-extractor-lambda (Triggered by S3)
- Should download video from S3
- Should extract frames using FFmpeg
- Should upload frames to S3 `frames/` folder
- Should invoke `ai-analysis-lambda`
- Look for: "Frames extracted" ✅

### 3. ai-analysis-lambda
- Should download frames from S3
- Should call OpenAI API
- Should generate report
- Should save to DynamoDB
- Status: `COMPLETED`

### 4. get-report-lambda
- Should return the final report with AI analysis

**CloudWatch Logs Links:**
- upload-init: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Famplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda
- frame-extractor: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Famplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda
- ai-analysis: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Famplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda

## Step 6: Verify Results

**Check DynamoDB:**
1. Go to DynamoDB Console
2. Find your `OpsCoachReport-*` table
3. Click "Explore table items"
4. Find your report (by `reportId` or `userId`)
5. Should see:
   - `processingStatus`: `COMPLETED`
   - `frameUrls`: Array of frame S3 keys
   - `aiReportMarkdown`: AI-generated analysis
   - `aiReportJson`: Structured AI data

**Check S3:**
1. Go to S3 Console
2. Find your bucket: `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
3. Check:
   - `uploads/` folder - your original video
   - `frames/` folder - extracted frames (should be multiple JPG files)

**Check Frontend:**
- Report should appear in dashboard
- Should show AI analysis

## 🐛 Troubleshooting

### "FFmpeg not found" error
- ✅ Layer is added (you just did this!)
- Check CloudWatch logs for exact error
- Verify layer is attached to function

### "Missing environment variable" error
- Go back to Step 1 and set all environment variables
- Redeploy if needed

### Video uploads but nothing happens
- Check S3 trigger is configured (Step 2)
- Check CloudWatch logs for `frame-extractor-lambda`
- Verify `BUCKET_NAME` environment variable

### Frames extracted but no AI analysis
- Check `AI_FUNCTION_NAME` in `frame-extractor-lambda`
- Check CloudWatch logs for `ai-analysis-lambda`
- Verify OpenAI API key is set

### "OpenAI API key missing"
- Run: `npx ampx sandbox secret list`
- Should see `OPENAI_API_KEY`
- If missing: `npx ampx sandbox secret set OPENAI_API_KEY`

## 🎯 Success Indicators

You'll know it's working when:
1. ✅ Video uploads successfully
2. ✅ CloudWatch shows "Frames extracted" in frame-extractor logs
3. ✅ Frames appear in S3 `frames/` folder
4. ✅ AI analysis completes (check ai-analysis logs)
5. ✅ Report appears in DynamoDB with `processingStatus: COMPLETED`
6. ✅ Report shows in frontend dashboard

## 🚀 Quick Test Command

After uploading a video, you can quickly check status:

```bash
# Check if frames were extracted (via AWS CLI)
aws s3 ls s3://amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom/frames/ --recursive --region us-east-2

# Check DynamoDB items (replace TABLE_NAME)
aws dynamodb scan --table-name OpsCoachReport-* --region us-east-2
```

Good luck! Let's see that pipeline in action! 🎬✨
