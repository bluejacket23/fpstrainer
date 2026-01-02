# 🚀 Quick Start: Test Your Pipeline

FFmpeg layer is added! Now let's test everything.

## ⚡ Quick Test (5 minutes)

### Step 1: Verify Environment Variables (2 min)

**Go to each Lambda function and check these are set:**

1. **upload-init-lambda**
   - `TABLE_NAME` = (find in DynamoDB console)
   - `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

2. **get-report-lambda**
   - `TABLE_NAME` = (same as above)

3. **ai-analysis-lambda**
   - `TABLE_NAME` = (same as above)
   - `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - `OPENAI_API_KEY` = (should be from secrets)

4. **frame-extractor-lambda**
   - `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - `AI_FUNCTION_NAME` = `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`

**Quick link:** https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions

**To find TABLE_NAME:**
- Go to: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables
- Look for table starting with `OpsCoachReport-`
- Copy the full name

### Step 2: Check S3 Trigger (1 min)

1. Go to `frame-extractor-lambda` function
2. Click **"Configuration"** → **"Triggers"**
3. **If you see an S3 trigger:** ✅ You're good!
4. **If no trigger:** See "Add S3 Trigger" section below

### Step 3: Start Frontend

```bash
npm run dev
```

Wait for: `Ready - started server on 0.0.0.0:3000`

### Step 4: Upload Test Video

1. Open: http://localhost:3000/login
2. Sign up/Login
3. Upload a short MP4 video (10-60 seconds)
4. Watch the magic! 🎬

### Step 5: Watch It Work

**Open CloudWatch Logs:**
- frame-extractor: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Famplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda

**Look for:**
- ✅ "Video downloaded"
- ✅ "Frames extracted" (this means FFmpeg worked!)
- ✅ "Uploaded X frames"
- ✅ "Invoked AI Analysis"

---

## 🔧 If S3 Trigger is Missing

**Add it manually:**

1. Go to `frame-extractor-lambda` function
2. Click **"Configuration"** → **"Triggers"**
3. Click **"Add trigger"**
4. Select **"S3"**
5. Configure:
   - **Bucket:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - **Event type:** `All object create events`
   - **Prefix:** `uploads/`
   - **Suffix:** `.mp4`
6. Check **"Recursive invocation"** (if shown)
7. Click **"Add"**

---

## ✅ Success Checklist

After uploading a video, verify:

- [ ] Video appears in S3 `uploads/` folder
- [ ] CloudWatch shows "Frames extracted" in frame-extractor logs
- [ ] Frames appear in S3 `frames/` folder (multiple JPG files)
- [ ] AI analysis completes (check ai-analysis logs)
- [ ] Report appears in DynamoDB with `processingStatus: COMPLETED`
- [ ] Report shows in frontend dashboard

---

## 🐛 Quick Troubleshooting

### "FFmpeg not found"
- ✅ Layer is added (you did this!)
- Check CloudWatch logs for exact error
- Verify layer shows in function's Layers section

### "Missing environment variable"
- Go back to Step 1 and set all variables
- Redeploy: `npx ampx sandbox --once`

### Video uploads but nothing happens
- Check S3 trigger is configured (Step 2)
- Check CloudWatch logs for errors
- Verify `BUCKET_NAME` is correct

### Frames extracted but no AI analysis
- Check `AI_FUNCTION_NAME` in frame-extractor
- Check ai-analysis CloudWatch logs
- Verify OpenAI API key is set

---

## 🎯 What to Watch For

**In CloudWatch Logs:**

1. **upload-init:** Creates DB record, returns presigned URL
2. **frame-extractor:** Downloads video, extracts frames with FFmpeg, uploads frames, invokes AI
3. **ai-analysis:** Downloads frames, calls OpenAI, saves report
4. **get-report:** Returns final report

**In S3:**
- `uploads/` - your video
- `frames/` - extracted frames (JPG files)

**In DynamoDB:**
- Report with `aiReportMarkdown` and `frameUrls`

---

## 🚀 You're Ready!

Everything should work now. Upload a video and watch the pipeline process it!

Good luck! 🎬✨

