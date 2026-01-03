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
  handleReferral,
});

// NOTE: S3 trigger must be configured manually or via script
// Run: node add-s3-trigger.js
// Or configure in AWS Console:
// 1. Go to frame-extractor Lambda function
// 2. Configuration → Triggers → Add trigger
// 3. Select S3, choose bucket, prefix: uploads/, suffix: .mp4

