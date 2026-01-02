# Verify OpenAI Secret is Set

## Secret List Output

When you run `npx ampx sandbox secret list`, you should see:
```
 - OPENAI_API_KEY
```

**This confirms the secret is set!** ✅

The value is masked (hidden) for security - that's normal.

## Important: Secret vs Environment Variable

**Two different things:**

1. **Secret** (what we just set):
   - Set via: `npx ampx sandbox secret set OPENAI_API_KEY`
   - Stored securely in AWS
   - Check with: `npx ampx sandbox secret list`

2. **Environment Variable** (what Lambda needs):
   - Set in Lambda Console → Environment variables
   - The function reads from `process.env.OPENAI_API_KEY`
   - Must be set separately (or wired up in code)

## Verify Lambda Can Access It

**Go to ai-analysis-lambda function:**
- Configuration → Environment variables
- **Check if `OPENAI_API_KEY` is listed:**
  - ✅ If YES: Function can access it (might be from secret or manually set)
  - ❌ If NO: Add it manually:
    1. Click "Edit"
    2. Add: Key = `OPENAI_API_KEY`, Value = (your API key)
    3. Save

## Test It Works

**Upload a video and check CloudWatch logs:**
- If you see "Starting analysis" → Function is running
- If you see "401 Incorrect API key" → Key is wrong
- If you see AI analysis completing → Key is correct! ✅

---

**The secret IS set (it's in the list). Now make sure the Lambda function can access it!**

