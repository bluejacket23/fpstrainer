# Debug Upload Error

The "Failed to initialize upload" error usually means the `upload-init` Lambda function is failing.

## Quick Checks

### 1. Check CloudWatch Logs

**Go to upload-init Lambda logs:**
- https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Famplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda

**Look for errors like:**
- "Missing environment variable"
- "AccessDenied" 
- "ResourceNotFoundException" (table not found)

### 2. Verify Environment Variables

**Go to upload-init Lambda function:**
- https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions/amplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda

**Check Configuration → Environment variables:**
- `TABLE_NAME` = (your DynamoDB table name)
- `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

**If missing:**
1. Click "Edit"
2. Add the variables
3. Click "Save"

### 3. Find Your Table Name

**Go to DynamoDB:**
- https://console.aws.amazon.com/dynamodbv2/home?region=us-east-2#tables

**Look for table starting with:** `OpsCoachReport-`

**Copy the full name** (e.g., `OpsCoachReport-mnwjtrxavndttangzj3klo3vlq-NONE`)

### 4. Check IAM Permissions

The function needs permissions to:
- Write to DynamoDB table
- Generate presigned URLs for S3

**If you see "AccessDenied" errors:**
- The function role might need additional permissions
- Check the function's execution role in IAM

### 5. Test the Function Directly

**In Lambda Console:**
1. Go to `upload-init-lambda` function
2. Click "Test"
3. Create a test event:
```json
{
  "identity": {
    "sub": "test-user-id"
  }
}
```
4. Click "Test"
5. Check the response and logs

## Common Errors

### "Missing environment variable TABLE_NAME"
- **Fix:** Set `TABLE_NAME` environment variable

### "Missing environment variable BUCKET_NAME"
- **Fix:** Set `BUCKET_NAME` environment variable

### "ResourceNotFoundException: Requested resource not found"
- **Fix:** Table name is wrong - verify in DynamoDB console

### "AccessDenied"
- **Fix:** Function needs IAM permissions (may need to redeploy or add manually)

### "User not authenticated"
- **Fix:** Make sure you're logged in on the frontend

## Quick Fix Script

If you have AWS CLI configured:

```powershell
# Get your table name first from DynamoDB console
$TABLE_NAME = "OpsCoachReport-XXXXX-NONE"  # Replace with actual name
$BUCKET_NAME = "amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom"

# Set environment variables
aws lambda update-function-configuration `
  --function-name amplify-opscoach-lukec-sandbox-a38e0e22ed-function-upload-init-lambda `
  --environment Variables="{TABLE_NAME=$TABLE_NAME,BUCKET_NAME=$BUCKET_NAME}" `
  --region us-east-2
```

## After Fixing

1. Try uploading again
2. Check CloudWatch logs if it still fails
3. The error message should now be more detailed (I updated the code)

