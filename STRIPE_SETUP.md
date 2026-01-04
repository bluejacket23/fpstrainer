# Stripe Payment Integration Setup Guide

This guide walks you through setting up Stripe payments for FPSTrainer. Follow each step carefully.

## Overview

The payment system includes:
- **Checkout Sessions**: Allow users to subscribe to paid plans
- **Customer Portal**: Let users manage their subscription (update payment, cancel)
- **Webhooks**: Handle subscription lifecycle events (payment success, cancellation, etc.)
- **Monthly Reset**: Automatically reset clips when subscription renews

## Prerequisites

1. A Stripe account (https://stripe.com)
2. AWS account with Amplify deployed
3. Your deployed Amplify app URL

---

## Step 1: Create Stripe Account & Get API Keys

### 1.1 Sign up at Stripe
Go to https://dashboard.stripe.com and create an account.

### 1.2 Get your API Keys
1. Go to **Developers** → **API keys**
2. Copy your keys:
   - **Test mode** (for development):
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Live mode** (for production):
     - Publishable key: `pk_live_...`
     - Secret key: `sk_live_...`

**⚠️ IMPORTANT**: Never expose your secret key in frontend code!

---

## Step 2: Create Products and Prices in Stripe

### 2.1 Go to Products
In Stripe Dashboard, go to **Products** → **Add product**

### 2.2 Create each subscription plan:

| Plan Name | Price | Billing | Product Name |
|-----------|-------|---------|--------------|
| ROOKIE | $5/month | Monthly | FPSTrainer Rookie |
| COMPETITIVE | $10/month | Monthly | FPSTrainer Competitive |
| ELITE | $15/month | Monthly | FPSTrainer Elite |
| PRO | $29/month | Monthly | FPSTrainer Pro |
| GOD | $59/month | Monthly | FPSTrainer God |

For each product:
1. Click **Add product**
2. Enter **Name** (e.g., "FPSTrainer Rookie")
3. Under **Pricing**, select:
   - **Recurring**
   - Price: Enter the dollar amount
   - Billing period: **Monthly**
4. Click **Save product**

### 2.3 Copy Price IDs
After creating each product, click on it and copy the **Price ID** (starts with `price_...`).

You'll need these Price IDs:
```
STRIPE_PRICE_ID_ROOKIE=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_COMPETITIVE=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_ELITE=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_GOD=price_xxxxxxxxxxxxx
```

---

## Step 3: Configure Customer Portal

### 3.1 Go to Customer Portal Settings
Navigate to **Settings** → **Billing** → **Customer portal**

### 3.2 Configure options:
1. Enable **Subscriptions**: Allow customers to cancel/switch subscriptions
2. Enable **Payment methods**: Allow customers to update payment methods
3. Enable **Invoices**: Allow customers to view/download invoices
4. Set **Default return URL**: Your account page URL (e.g., `https://fpstrainer.com/account`)
5. Under **Subscriptions** → **Cancellation**, enable cancellation

### 3.3 Save changes

---

## Step 4: Set Up Webhook Endpoint

### 4.1 Deploy Your App First
Make sure your Amplify app is deployed so you have the webhook URL.

### 4.2 Get Your Webhook URL
Your webhook URL will be your API endpoint for the stripe-webhook function.
It should look something like:
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/stripe-webhook
```

Or if using Amplify's function URL:
```
https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/
```

### 4.3 Create Webhook in Stripe
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL
4. Under **Select events to listen to**, add these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**

### 4.4 Copy Webhook Signing Secret
After creating the webhook:
1. Click on the webhook endpoint
2. Under **Signing secret**, click **Reveal**
3. Copy the secret (starts with `whsec_...`)

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Step 5: Configure Lambda Environment Variables

You need to set environment variables for the following Lambda functions:
- `create-checkout-session`
- `stripe-webhook`
- `cancel-subscription`
- `customer-portal`

### 5.1 Using AWS Console

1. Go to **AWS Lambda** console
2. Find each function (search for "checkout", "webhook", "cancel", "portal")
3. Go to **Configuration** → **Environment variables**
4. Add the following variables:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_ROOKIE=price_...
STRIPE_PRICE_ID_COMPETITIVE=price_...
STRIPE_PRICE_ID_ELITE=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_GOD=price_...
FRONTEND_URL=https://your-app-url.com
USER_TABLE_NAME=User-xxxxx (your Amplify User table name)
```

### 5.2 Using AWS CLI

Run this for each function (replace values):

```bash
aws lambda update-function-configuration \
  --function-name create-checkout-session-xxxx \
  --environment "Variables={
    STRIPE_SECRET_KEY=sk_test_xxx,
    STRIPE_WEBHOOK_SECRET=whsec_xxx,
    STRIPE_PRICE_ID_ROOKIE=price_xxx,
    STRIPE_PRICE_ID_COMPETITIVE=price_xxx,
    STRIPE_PRICE_ID_ELITE=price_xxx,
    STRIPE_PRICE_ID_PRO=price_xxx,
    STRIPE_PRICE_ID_GOD=price_xxx,
    FRONTEND_URL=https://fpstrainer.com,
    USER_TABLE_NAME=User-xxx
  }"
```

### 5.3 Finding Your Table Name
1. Go to **AWS DynamoDB** console
2. Look for a table starting with `User-`
3. Copy the full table name

---

## Step 6: Configure Webhook Lambda (API Gateway or Function URL)

The webhook needs to be accessible from Stripe's servers.

### Option A: Using API Gateway (Recommended)

1. Go to **AWS API Gateway** console
2. Create a new **HTTP API**
3. Add a route: `POST /stripe-webhook`
4. Integrate it with your `stripe-webhook` Lambda function
5. Deploy the API
6. Use the deployment URL as your webhook endpoint in Stripe

### Option B: Using Lambda Function URL

1. Go to your `stripe-webhook` Lambda function
2. Go to **Configuration** → **Function URL**
3. Click **Create function URL**
4. Auth type: **NONE** (Stripe uses signature verification)
5. Copy the function URL and use it in Stripe webhook settings

---

## Step 7: Test the Integration

### 7.1 Enable Test Mode
Make sure you're using test API keys (`sk_test_...`, `pk_test_...`).

### 7.2 Test Card Numbers
Use these Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### 7.3 Test Checkout Flow
1. Go to your app
2. Click a plan's "SELECT" button
3. Complete checkout with test card
4. Verify you're redirected to account page with success message
5. Check that your plan updated

### 7.4 Test Webhook
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click your webhook endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Check your Lambda logs in CloudWatch

### 7.5 Test Cancellation
1. Go to Account page
2. Click "CANCEL SUBSCRIPTION"
3. Confirm cancellation
4. Verify subscription shows as pending cancellation

---

## Step 8: Go Live

### 8.1 Switch to Live Keys
1. Replace all `sk_test_` keys with `sk_live_` keys
2. Update all Lambda environment variables
3. Create a new webhook endpoint with your live endpoint URL
4. Update `STRIPE_WEBHOOK_SECRET` with the live webhook secret

### 8.2 Create Live Products
Products you created in test mode are separate from live mode.
Repeat Step 2 in **live mode** to create your products/prices.
Update all `STRIPE_PRICE_ID_*` environment variables.

### 8.3 Verify Configuration
Run through the test flow with a real card to ensure everything works.

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` |
| `STRIPE_PRICE_ID_ROOKIE` | Price ID for Rookie plan | `price_xxx` |
| `STRIPE_PRICE_ID_COMPETITIVE` | Price ID for Competitive plan | `price_xxx` |
| `STRIPE_PRICE_ID_ELITE` | Price ID for Elite plan | `price_xxx` |
| `STRIPE_PRICE_ID_PRO` | Price ID for Pro plan | `price_xxx` |
| `STRIPE_PRICE_ID_GOD` | Price ID for God plan | `price_xxx` |
| `FRONTEND_URL` | Your app's URL | `https://fpstrainer.com` |
| `USER_TABLE_NAME` | DynamoDB User table name | `User-abc123` |

---

## Troubleshooting

### Checkout not redirecting
- Check browser console for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Lambda logs in CloudWatch

### Webhook not working
- Verify webhook URL is correct in Stripe
- Check `STRIPE_WEBHOOK_SECRET` matches
- Test with Stripe's webhook tester
- Check Lambda logs for errors

### User not updated after payment
- Verify webhook is receiving events
- Check `USER_TABLE_NAME` is correct
- Look for errors in webhook Lambda logs

### "Payment system not configured" error
- `STRIPE_SECRET_KEY` is not set on the Lambda function
- Redeploy the function after setting environment variables

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend  │────▶│ create-checkout │────▶│    Stripe    │
│  (React)    │     │    Lambda       │     │   Checkout   │
└─────────────┘     └─────────────────┘     └──────────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  DynamoDB   │◀────│ stripe-webhook  │◀────│   Stripe     │
│   (User)    │     │    Lambda       │     │   Events     │
└─────────────┘     └─────────────────┘     └──────────────┘

User clicks "SELECT" → Frontend calls createCheckoutSession mutation
→ Lambda creates Stripe Checkout Session → User redirected to Stripe
→ User pays → Stripe sends webhook → Lambda updates user in DynamoDB
→ User redirected back to app with success message
```

---

## Monthly Clip Reset Logic (30-Day Rolling Window)

The system handles clip resets in two ways:

1. **On Upload**: The `upload-init` function checks if **30 days have passed** since `monthStartDate`. If so, it resets clips before checking limits. This is a rolling 30-day window from the user's first upload (or last reset).

2. **On Payment**: The `stripe-webhook` handles `invoice.payment_succeeded` events. When a subscription renews, it resets the user's clips to their plan limit and starts a new 30-day window.

This ensures users always get their full monthly allocation when:
- A new billing period starts (automatic via webhook)
- 30 days have passed since their last clip reset (checked on upload)

**Note**: This is NOT calendar-month-based. If a user signs up on January 15th, their clips reset on February 14th (30 days later), not February 1st.

---

## Security Best Practices

1. **Never expose secret keys**: Only use secret keys in Lambda, never in frontend
2. **Verify webhooks**: Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
3. **Use HTTPS**: Ensure all URLs use HTTPS
4. **Test thoroughly**: Use test mode before going live
5. **Monitor**: Set up CloudWatch alarms for Lambda errors

---

## Support

For issues with:
- **Stripe**: https://support.stripe.com
- **AWS Amplify**: https://docs.amplify.aws
- **This integration**: fpstrainer@email.com

