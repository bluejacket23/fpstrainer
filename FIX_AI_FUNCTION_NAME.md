# Fix AI Function Name

The frame-extractor is trying to invoke:
`amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`

But that function doesn't exist. We need to find the actual function name.

## Step 1: Find the Actual Function Name

1. **Go to Lambda Console:**
   - https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Search for: `ai-analysis`
   - Look for the function (might be named differently)

**Common patterns:**
- `amplify-opscoach-lukec-sa-aianalysislambda...`
- `amplify-opscoach-lukec-sandbox-a38e0e22ed-function-ai-analysis-lambda`
- `amplify-opscoach-lukec-sa-ai-analysis-lambda...`

2. **Click on the function**
3. **Copy the exact function name** from the top of the page

## Step 2: Update Environment Variable

1. **Go to frame-extractor-lambda function**
2. **Configuration → Environment variables → Edit**
3. **Find `AI_FUNCTION_NAME`**
4. **Update the value** with the exact function name you found
5. **Save**

## Step 3: Test Again

After updating, either:
- Upload a new video (will trigger automatically)
- Or manually trigger frame-extractor again

## Alternative: Use Function ARN

If you can't find the name, you can use the full ARN:
- Format: `arn:aws:lambda:us-east-2:954976304902:function:FUNCTION_NAME`
- Get it from the function's Configuration → General information

But the function name (without ARN) should work too.

---

**The function name is probably slightly different from what we guessed. Find it in the Lambda console!**

