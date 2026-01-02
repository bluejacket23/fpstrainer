# Add IAM Permissions for Lambda Functions

The error shows the function needs DynamoDB and S3 permissions. Here's how to add them manually.

## Quick Fix: Add Permissions via IAM Console

### Step 1: Find the Function's Execution Role

1. **Go to Lambda Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Find: `upload-init-lambda`
   - Click on it

2. **Get the Role Name:**
   - Click **"Configuration"** tab
   - Click **"Permissions"** in left sidebar
   - Click on the **Execution role** name (it will open IAM)

### Step 2: Add DynamoDB Permissions

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
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-2:954976304902:table/OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE"
    }
  ]
}
```

4. Click **"Next"**
5. Name it: `DynamoDBAccess`
6. Click **"Create policy"**

### Step 3: Add S3 Permissions

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

### Step 4: Test Again

After adding both policies, try uploading a video again. It should work!

---

## Alternative: Use AWS CLI (If You Have It)

```powershell
# Get the role name from Lambda function
$ROLE_NAME = "amplify-opscoach-lukec-sa-uploadinitlambdaServiceRo-slMvwO4e1FTL"  # Get from Lambda console

# Add DynamoDB policy
aws iam put-role-policy `
  --role-name $ROLE_NAME `
  --policy-name DynamoDBAccess `
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:us-east-2:954976304902:table/OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE"
    }]
  }' `
  --region us-east-2

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
```

---

## What I Tried in Code

I attempted to wire up permissions in `amplify/backend.ts`, but the API might not be correct. If the manual approach works, we can fix the code wiring later.

The key is: **The function role needs permissions to write to DynamoDB and access S3.**

