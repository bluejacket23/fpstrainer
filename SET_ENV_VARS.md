# Set Environment Variables for Lambda Functions

## Your Table Name
**`OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`**

## Your Bucket Name
**`amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`**

---

## Step-by-Step: Set Environment Variables

### Function 1: upload-init-lambda

1. **Go to Lambda Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `upload-init`
   - Click on: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda`

2. **Add Environment Variables:**
   - Click **"Configuration"** tab
   - Click **"Environment variables"** in left sidebar
   - Click **"Edit"**
   - Click **"Add environment variable"**
   - Add:
     - **Key:** `TABLE_NAME`
     - **Value:** `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
   - Click **"Add environment variable"** again
   - Add:
     - **Key:** `BUCKET_NAME`
     - **Value:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - Click **"Save"**

### Function 2: get-report-lambda

1. Find: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-get-report-lambda`
2. Add environment variable:
   - **Key:** `TABLE_NAME`
   - **Value:** `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
3. Click **"Save"**

### Function 3: ai-analysis-lambda

1. Find: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`
2. Add environment variables:
   - **Key:** `TABLE_NAME`
     - **Value:** `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
   - **Key:** `BUCKET_NAME`
     - **Value:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - **Note:** `OPENAI_API_KEY` should already be set from secrets
3. Click **"Save"**

### Function 4: frame-extractor-lambda

1. Find: `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-frame-extractor-lambda`
2. Add environment variables:
   - **Key:** `BUCKET_NAME`
     - **Value:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`
   - **Key:** `AI_FUNCTION_NAME`
     - **Value:** `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`
3. Click **"Save"**

---

## Quick Copy-Paste Values

**TABLE_NAME:**
```
OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE
```

**BUCKET_NAME:**
```
amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom
```

**AI_FUNCTION_NAME:**
```
amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda
```

---

## After Setting Variables

1. Try uploading a video again
2. The error should be fixed!
3. Check CloudWatch logs if there are any other issues

---

## Quick Links

- **Lambda Functions:** https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
- **DynamoDB Tables:** https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables

