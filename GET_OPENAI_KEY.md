# How to Get a New OpenAI API Key

## Step 1: Go to OpenAI Platform

1. **Open your browser**
2. **Go to:** https://platform.openai.com/api-keys
3. **Log in** with your OpenAI account (or create one if you don't have one)

## Step 2: Create a New API Key

1. **Click "Create new secret key"** button (usually at the top right)
2. **Give it a name** (optional, but helpful):
   - Example: "OpsCoach Lambda Function"
   - This helps you remember what it's for
3. **Click "Create secret key"**
4. **IMPORTANT: Copy the key immediately!**
   - The key will be shown only once
   - It looks like: `sk-proj-...` (long string)
   - **Copy it now** - you won't be able to see it again!

## Step 3: Save the Key

**Paste it somewhere safe temporarily** (you'll use it in the next step):
- Notepad
- Text file
- Or just keep it in your clipboard

**⚠️ WARNING:** Don't share this key publicly or commit it to git!

## Step 4: Set It in Your Project

**Option A: Update the Secret (Recommended)**
```bash
npx ampx sandbox secret set OPENAI_API_KEY
```
- When prompted, paste your new API key
- Press Enter

**Option B: Set as Environment Variable in Lambda**
1. Go to `ai-analysis-lambda` function
2. Configuration → Environment variables → Edit
3. Find `OPENAI_API_KEY`
4. Update the value with your new key
5. Save

## Step 5: Verify It Works

After setting the key, try uploading a video again. The AI analysis should work!

---

## Troubleshooting

### "Incorrect API key provided"
- Make sure you copied the entire key (it's very long)
- Make sure there are no extra spaces
- Make sure the key starts with `sk-proj-` or `sk-`

### "You exceeded your current quota"
- Your OpenAI account might need billing set up
- Go to: https://platform.openai.com/account/billing
- Add a payment method

### "Rate limit exceeded"
- You're making too many requests
- Wait a few minutes and try again
- Or upgrade your OpenAI plan

---

## Quick Checklist

- [ ] Logged into OpenAI platform
- [ ] Created new secret key
- [ ] Copied the key (it's long!)
- [ ] Set it via: `npx ampx sandbox secret set OPENAI_API_KEY`
- [ ] Updated Lambda environment variable (if using that method)
- [ ] Ready to test!

---

**The key should start with `sk-proj-` and be very long (hundreds of characters).**

