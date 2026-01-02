# Final Setup: ai-analysis-lambda

AI analysis is being invoked! Just needs environment variables.

## Add Environment Variables

**Go to ai-analysis-lambda function:**
- https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
- Search for: `ai-analysis`
- Click on the function

**Configuration → Environment variables → Edit**

**Add these:**
- **Key:** `TABLE_NAME`
  **Value:** `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`

- **Key:** `BUCKET_NAME`
  **Value:** `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

- **Key:** `OPENAI_API_KEY`
  **Value:** (get it with: `npx ampx sandbox secret get OPENAI_API_KEY`)

**Save**

## Also Add IAM Permissions

The function needs permissions to:
- Update DynamoDB (to save the report)
- Read from S3 (to get frame URLs)

**Go to ai-analysis-lambda → Permissions → Execution role**

**Add inline policy for DynamoDB:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem", "dynamodb:UpdateItem"],
    "Resource": "arn:aws:dynamodb:us-east-2:954976304902:table/OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE"
  }]
}
```

**Add inline policy for S3:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom/*"
  }]
}
```

## After Setup

Once environment variables and permissions are set:
- ✅ Upload video
- ✅ Frame extraction runs
- ✅ AI analysis runs
- ✅ Report is generated
- ✅ Status updates to COMPLETED
- ✅ Frontend shows the report!

**This is the last step!** 🚀

