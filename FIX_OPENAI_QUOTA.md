# Fix OpenAI Quota Error

The error "429 You exceeded your current quota" means:
- ✅ Your API key is **working correctly**!
- ❌ But you've hit your **usage limit** or need to add billing

## Step 1: Add Billing to OpenAI

1. **Go to OpenAI Billing:**
   - https://platform.openai.com/account/billing
   - Or: https://platform.openai.com → Click your profile → Billing

2. **Add Payment Method:**
   - Click "Add payment method"
   - Enter your credit card details
   - Save

3. **Set Usage Limits (Optional):**
   - You can set monthly spending limits
   - Or leave unlimited (be careful with costs!)

## Step 2: Check Your Usage

**Go to Usage Dashboard:**
- https://platform.openai.com/usage
- See how much you've used
- Check your current limits

## Step 3: Wait a Bit

**If you just added billing:**
- It might take a few minutes to activate
- Try uploading again in 5-10 minutes

## Step 4: Test Again

After adding billing:
1. Upload a new video
2. The AI analysis should work now!
3. Check CloudWatch logs - should see successful OpenAI calls

---

## Understanding the Error

**429 Quota Exceeded:**
- Your account has a spending limit
- Free tier has very low limits
- Paid accounts have higher limits
- You need to add a payment method to increase limits

**This is NOT an API key problem** - the key is working! ✅

---

## Cost Estimate

**For your use case (analyzing gameplay clips):**
- Each video analysis uses the Vision API
- Cost depends on:
  - Number of frames analyzed
  - Image resolution
  - Model used (GPT-4 Vision is more expensive)
- Rough estimate: $0.01 - $0.10 per video analysis
- Set a monthly limit if you're concerned about costs

---

**Once billing is added, try uploading again!** 🚀

