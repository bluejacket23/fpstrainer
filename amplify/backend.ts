import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { uploadInit } from './functions/upload-init/resource';
import { getReport } from './functions/get-report/resource';
import { listReports } from './functions/list-reports/resource';
import { aiAnalysis } from './functions/ai-analysis/resource';
import { frameExtractor } from './functions/frame-extractor/resource';
import { getThumbnailUrl } from './functions/get-thumbnail-url/resource';
import { generateShareableGraphic } from './functions/generate-shareable-graphic/resource';
import { generateTrainingProgram } from './functions/generate-training-program/resource';
import { cleanupResources } from './functions/cleanup-resources/resource';
import { createCheckoutSession } from './functions/create-checkout-session/resource';
import { stripeWebhook } from './functions/stripe-webhook/resource';
import { cancelSubscription } from './functions/cancel-subscription/resource';
import { customerPortal } from './functions/customer-portal/resource';
import { handleReferral } from './functions/handle-referral/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  uploadInit,
  getReport,
  listReports,
  aiAnalysis,
  frameExtractor,
  getThumbnailUrl,
  generateShareableGraphic,
  generateTrainingProgram,
  cleanupResources,
  createCheckoutSession,
  stripeWebhook,
  cancelSubscription,
  customerPortal,
  handleReferral,
});

// NOTE: S3 trigger must be configured manually or via script
// Run: node add-s3-trigger.js
// Or configure in AWS Console:
// 1. Go to frame-extractor Lambda function
// 2. Configuration → Triggers → Add trigger
// 3. Select S3, choose bucket, prefix: uploads/, suffix: .mp4

// STRIPE CONFIGURATION:
// The following environment variables need to be set for each Stripe-related Lambda function:
// - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
// - STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret (whsec_...)
// - STRIPE_PRICE_ID_ROOKIE: Price ID for Rookie plan ($5/month)
// - STRIPE_PRICE_ID_COMPETITIVE: Price ID for Competitive plan ($10/month)
// - STRIPE_PRICE_ID_ELITE: Price ID for Elite plan ($15/month)
// - STRIPE_PRICE_ID_PRO: Price ID for Pro plan ($29/month)
// - STRIPE_PRICE_ID_GOD: Price ID for God plan ($59/month)
// - FRONTEND_URL: Your app's URL (e.g., https://fpstrainer.com)
//
// Set these via AWS Console or AWS CLI:
// aws lambda update-function-configuration --function-name <function-name> --environment "Variables={STRIPE_SECRET_KEY=sk_...,STRIPE_WEBHOOK_SECRET=whsec_...}"
