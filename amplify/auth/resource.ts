import { defineAuth } from '@aws-amplify/backend';

/**
 * Define authentication resource
 * 
 * TODO: To enable Google sign-in, uncomment the externalProviders section
 * and add your Google OAuth credentials using AWS Secrets Manager:
 * 
 * 1. Create secrets in AWS Secrets Manager:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 * 
 * 2. Reference them in backend.ts using secret() function
 * 
 * For now, Google sign-in is disabled to avoid build errors.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // Google sign-in - uncomment when credentials are configured
    // externalProviders: {
    //   google: {
    //     clientId: secret('GOOGLE_CLIENT_ID'),
    //     clientSecret: secret('GOOGLE_CLIENT_SECRET'),
    //   },
    // },
  },
});

