import { defineAuth } from '@aws-amplify/backend';

/**
 * FPSTrainer Authentication Configuration
 * 
 * Email/password sign-in only for initial production deployment.
 * Google OAuth will be added after domain is live and configured.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
