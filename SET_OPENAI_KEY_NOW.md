# Set Your OpenAI API Key

You already have a key! Here's how to set it up:

## Step 1: Set as Secret

**Run this command:**
```bash
npx ampx sandbox secret set OPENAI_API_KEY
```

**When prompted:**
- Paste your API key: `YOUR_API_KEY_HERE`
- Press Enter

## Step 2: Update Lambda Environment Variable

**Go to ai-analysis-lambda function:**
- https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
- Search for: `ai-analysis`
- Click on the function

**Configuration → Environment variables → Edit**

**Update `OPENAI_API_KEY`:**
- Find the `OPENAI_API_KEY` variable
- Update the value with your key (same one from Step 1)
- **Make sure there are no extra spaces!**
- Save

## Step 3: Add DynamoDB Permission

**Go to ai-analysis-lambda → Permissions → Execution role**

**Add inline policy (JSON tab):**
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

**Name it:** `DynamoDBAccess`
**Create policy**

## Step 4: Add S3 Permission (if not already added)

**Same role, add another inline policy:**
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

**Name it:** `S3Access`
**Create policy**

## Step 5: Test!

After setting everything:
1. Upload a new video
2. Watch CloudWatch logs
3. Should see AI analysis complete!
4. Report should appear in frontend!

---

**Important:** Make sure the API key is copied completely - it's very long!

