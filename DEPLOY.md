# OpsCoach.ai Deployment Instructions

## Prerequisites
1. AWS Account
2. Node.js 18+
3. NPM
4. Git

## 1. Setup
Run the following in the project root:
```bash
npm install
```

## 2. FFmpeg Layer (CRITICAL)
The `frame-extractor` Lambda function requires FFmpeg.
Since Amplify Gen 2 manages Lambdas, you need to attach a Layer.

**Option A: Add via AWS Console (After Deployment)**
1. Deploy the app first.
2. Go to AWS Lambda Console.
3. Find the `frame-extractor` function.
4. Scroll to "Layers" -> "Add a layer".
5. Choose "Specify an ARN" or "AWS layers" if available.
6. Use a public FFmpeg layer ARN for your region (Node.js 18/20 x86_64).
   - Example (US-EAST-1): `arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4`
   - Search for "ffmpeg lambda layer [your-region]" to find one.

**Option B: Add in Code (Before Deployment)**
Edit `amplify/functions/frame-extractor/resource.ts`:
```typescript
export const frameExtractor = defineFunction({
  // ...
  layers: {
    'ffmpeg': 'arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4' // REPLACE WITH YOUR REGION'S ARN
  }
});
```

## 3. OpenAI API Key
You need to set the `OPENAI_API_KEY` secret.

**For Sandbox (Local Dev):**
```bash
npx ampx sandbox secret set OPENAI_API_KEY
```
Enter your key when prompted.

**For Production (Amplify Console):**
1. Go to Amplify Console -> App Settings -> Environment Variables.
2. Add `OPENAI_API_KEY`.

## 4. Deploy
**Local Development (Sandbox):**
```bash
npx ampx sandbox
```
This will deploy a temporary backend and start the frontend.

**Production Deployment:**
1. Push this code to a GitHub repository.
2. Go to AWS Amplify Console.
3. "Create new app" -> "GitHub".
4. Select your repo and branch.
5. Amplify will detect the Gen 2 backend and deploy everything.

## 5. Post-Deployment
1. Verify the `frame-extractor` has the FFmpeg layer.
2. Verify the `OPENAI_API_KEY` is set.
3. Upload a clip!

## Architecture
- **Frontend**: Next.js + Tailwind + Amplify UI
- **Auth**: Cognito (Email/Password)
- **Database**: DynamoDB (Reports)
- **Storage**: S3 (Uploads & Frames)
- **Compute**:
  - `upload-init`: Presigned URLs
  - `frame-extractor`: FFmpeg processing (S3 Trigger)
  - `ai-analysis`: GPT-4o Vision
  - `get-report`: Fetch results

