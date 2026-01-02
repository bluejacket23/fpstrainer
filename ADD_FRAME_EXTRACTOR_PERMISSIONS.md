# Add IAM Permissions for frame-extractor-lambda

The function needs S3 permissions to read videos and write frames.

## Quick Fix: Add S3 Permissions

### Step 1: Find the Function's Execution Role

1. **Go to Lambda Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Find: `frame-extractor-lambda`
   - Click on it

2. **Get the Role Name:**
   - Click **"Configuration"** tab
   - Click **"Permissions"** in left sidebar
   - Click on the **Execution role** name (it will open IAM)

### Step 2: Add S3 Permissions

**In IAM Console (should be open from Step 1):**

1. Click **"Add permissions"** → **"Create inline policy"**
2. Click **"JSON"** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom/*"
    }
  ]
}
```

4. Click **"Next"**
5. Name it: `S3Access`
6. Click **"Create policy"**

### Step 3: Add Lambda Invoke Permission

The function also needs to invoke `ai-analysis-lambda`:

1. Still in the same role, click **"Add permissions"** → **"Create inline policy"** again
2. Click **"JSON"** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-2:954976304902:function:amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda*"
    }
  ]
}
```

4. Click **"Next"**
5. Name it: `LambdaInvoke`
6. Click **"Create policy"**

### Step 4: Test Again

After adding both policies, try uploading a video again. The frame-extractor should now be able to:
- ✅ Download videos from S3
- ✅ Upload frames to S3
- ✅ Invoke ai-analysis function

---

## Alternative: Use AWS CLI (If You Have It)

```powershell
# Get the role name from Lambda function
$ROLE_NAME = "amplify-opscoach-lukec-sa-frameextractorlambdaServi-eQRtS3kEvdG8"  # Get from Lambda console

# Add S3 policy
aws iam put-role-policy `
  --role-name $ROLE_NAME `
  --policy-name S3Access `
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom/*"
    }]
  }' `
  --region us-east-2

# Add Lambda invoke policy
aws iam put-role-policy `
  --role-name $ROLE_NAME `
  --policy-name LambdaInvoke `
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:us-east-2:954976304902:function:amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda*"
    }]
  }' `
  --region us-east-2
```

---

## What This Fixes

- ✅ Function can download videos from S3
- ✅ Function can upload extracted frames to S3
- ✅ Function can invoke ai-analysis-lambda

After adding these, the full pipeline should work! 🚀

