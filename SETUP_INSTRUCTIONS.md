# Complete Setup Instructions: Video Upload & OpenAI Integration

Follow these steps **in order** to get video gameplay uploads and OpenAI API working.

## Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+ installed
- OpenAI API key (get one from https://platform.openai.com/api-keys)

---

## Step 1: Set OpenAI API Key Secret

**Before deploying**, set your OpenAI API key as a secret in the Amplify sandbox:

```bash
npx ampx sandbox secret set OPENAI_API_KEY
```

When prompted, paste your OpenAI API key and press Enter.

**Important:** Do this BEFORE running `npx ampx sandbox` for the first time, or the AI analysis function won't work.

---

## Step 2: Verify FFmpeg Layer ARN

The FFmpeg layer ARN is already configured in `amplify/functions/frame-extractor/resource.ts`.

**Current ARN:** `arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4`

**If this doesn't work** (you'll see errors about FFmpeg not found), you can:

1. **Find alternative ARNs** at: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
2. **Or manually add after deployment:**
   - Go to AWS Lambda Console
   - Find the `frame-extractor` function
   - Go to "Layers" → "Add a layer"
   - Choose "Specify an ARN" and enter: `arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4`

**Common ARNs by region:**
- `us-east-1`: `arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4`
- `us-east-2`: `arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4`
- `us-west-2`: `arn:aws:lambda:us-west-2:145266761615:layer:ffmpeg:4`

---

## Step 3: Deploy the Backend

**Terminal 1 - Start the Amplify Sandbox:**

```bash
npx ampx sandbox
```

This will:
- Deploy all Lambda functions (upload-init, get-report, ai-analysis, frame-extractor)
- Create DynamoDB table for reports
- Create S3 bucket for video uploads
- Set up Cognito authentication
- Configure S3 trigger to automatically process videos when uploaded
- Wire up all environment variables and permissions

**Wait for deployment to complete** (you'll see "✔ Deployment completed").

**Note:** The first deployment may take 5-10 minutes. Subsequent deployments are faster.

---

## Step 4: Start the Frontend

**Terminal 2 - Start Next.js Dev Server:**

```bash
npm run dev
```

This starts the frontend at `http://localhost:3000`.

---

## Step 5: Verify Everything Works

### Check 1: OpenAI Key is Set
- The `ai-analysis` function should have access to `OPENAI_API_KEY` from secrets
- If you see errors about missing API key, run Step 1 again

### Check 2: FFmpeg Layer is Attached
- Go to AWS Lambda Console → `frame-extractor` function
- Check "Layers" section - should show the FFmpeg layer
- If missing, add it manually (see Step 2)

### Check 3: S3 Trigger is Configured
- Go to AWS Lambda Console → `frame-extractor` function
- Check "Configuration" → "Triggers"
- Should show an S3 trigger for the storage bucket with prefix `uploads/` and suffix `.mp4`

### Check 4: Environment Variables
All functions should have these environment variables set:
- **upload-init**: `TABLE_NAME`, `BUCKET_NAME`
- **get-report**: `TABLE_NAME`
- **ai-analysis**: `TABLE_NAME`, `BUCKET_NAME`, `OPENAI_API_KEY`
- **frame-extractor**: `BUCKET_NAME`, `AI_FUNCTION_NAME`

---

## Step 6: Test Video Upload

1. **Sign up/Login** at `http://localhost:3000/login`
2. **Upload a video** (max 60 seconds, MP4 format)
3. **Watch the processing:**
   - Video uploads to S3
   - `frame-extractor` automatically triggers
   - Frames are extracted (1 per second)
   - `ai-analysis` is invoked
   - Report is generated and saved to DynamoDB
4. **View the report** in the dashboard

---

## Troubleshooting

### Error: "FFmpeg not found"
- The FFmpeg layer ARN might be wrong for your region
- Check the ARN in `amplify/functions/frame-extractor/resource.ts`
- Manually add the layer via AWS Console (see Step 2)

### Error: "Missing OpenAI API Key"
- Run: `npx ampx sandbox secret set OPENAI_API_KEY`
- Make sure you entered the key correctly
- Redeploy: `npx ampx sandbox`

### Error: "TABLE_NAME is not defined"
- The backend wiring might have failed
- Check `amplify/backend.ts` for correct resource references
- Redeploy: `npx ampx sandbox`

### Video uploads but processing doesn't start
- Check S3 trigger is configured (see Check 3 above)
- Check CloudWatch logs for `frame-extractor` function
- Verify the video is uploaded to `uploads/{userId}/{reportId}.mp4` path

### AI analysis fails
- Check OpenAI API key is set correctly
- Check CloudWatch logs for `ai-analysis` function
- Verify you have credits in your OpenAI account

---

## Architecture Flow

1. **User uploads video** → Frontend calls `initUpload` mutation
2. **Presigned URL generated** → User uploads directly to S3
3. **S3 trigger fires** → `frame-extractor` Lambda is invoked
4. **Frames extracted** → Using FFmpeg (1 frame per second)
5. **Frames uploaded to S3** → Under `frames/{userId}/{reportId}/`
6. **AI analysis invoked** → `frame-extractor` calls `ai-analysis`
7. **GPT-4o analyzes frames** → Generates coaching report
8. **Report saved** → DynamoDB table updated with results
9. **User views report** → Frontend calls `getReportCustom` query

---

## Next Steps

Once everything is working:
- Test with different video lengths and formats
- Monitor CloudWatch logs for any errors
- Adjust AI prompt in `amplify/functions/ai-analysis/handler.ts` if needed
- Customize the report format in the frontend

