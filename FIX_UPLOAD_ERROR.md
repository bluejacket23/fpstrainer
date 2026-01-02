# Fix "Internal Server Error" in upload-init

The error "Lambda:Unhandled" means the function is running but crashing. Let's debug it.

## Step 1: Check CloudWatch Logs

**The log group should exist now since the function was invoked.**

1. **Go to CloudWatch Logs:**
   - https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
   - Search for: `upload-init`
   - Click on the log group
   - Click on the most recent log stream
   - **Look for the actual error message**

**Common errors you might see:**

### Error: "Missing environment variable TABLE_NAME"
- **Fix:** Set `TABLE_NAME` environment variable (you should have done this)

### Error: "Missing environment variable BUCKET_NAME"
- **Fix:** Set `BUCKET_NAME` environment variable (you should have done this)

### Error: "AccessDenied" or "User: arn:aws:iam::... is not authorized"
- **Fix:** Function needs IAM permissions (see Step 2)

### Error: "ResourceNotFoundException: Requested resource not found"
- **Fix:** Table name is wrong - double-check it matches exactly

### Error: "Cannot read property 'sub' of undefined"
- **Fix:** Authentication issue - make sure you're logged in

## Step 2: Verify Environment Variables Are Set

**Double-check the environment variables are actually saved:**

1. Go to `upload-init-lambda` function
2. **Configuration** → **Environment variables**
3. Verify you see:
   - `TABLE_NAME` = `OpsCoachReport-3bzw4rslizbxxmhxql4h7mvxhe-NONE`
   - `BUCKET_NAME` = `amplify-opscoach-lukec-sa-opscoachstoragebucket512-9lv2ubpafoom`

**If they're missing or wrong:**
- Click **"Edit"**
- Add/update them
- Click **"Save"**
- Wait a few seconds for the update to propagate

## Step 3: Check IAM Permissions

The function needs permissions to:
- Write to DynamoDB
- Generate S3 presigned URLs

**Check the function's execution role:**
1. Go to `upload-init-lambda` function
2. **Configuration** → **Permissions**
3. Click on the **Execution role** name
4. Check if it has policies for:
   - DynamoDB write access
   - S3 read/write access

**If permissions are missing:**
- We may need to redeploy or add them manually
- Or the backend.ts wiring needs to be uncommented

## Step 4: Test the Function Directly

**Test the function in Lambda Console:**

1. Go to `upload-init-lambda` function
2. Click **"Test"** tab
3. Create a new test event:
```json
{
  "identity": {
    "sub": "test-user-123"
  }
}
```
4. Click **"Test"**
5. Check the response and logs

**This will show you the exact error without going through GraphQL.**

## Step 5: Check Browser Console

**Open browser DevTools (F12) and check:**
- Network tab - see the GraphQL request/response
- Console tab - see if there are any other errors

## Most Likely Issues

1. **Environment variables not saved properly** - Double-check they're there
2. **IAM permissions missing** - Function can't access DynamoDB or S3
3. **Table name typo** - Make sure it matches exactly (case-sensitive)

## Quick Fix: Redeploy Backend

If nothing works, try redeploying:

```bash
npx ampx sandbox --once
```

This will ensure everything is wired up correctly.

---

**Next Step:** Check the CloudWatch logs and tell me what error you see!

