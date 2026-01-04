import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * FPSTrainer Authentication Configuration
 * 
 * Supports:
 * - Email/password sign-in
 * - Google OAuth sign-in
 * 
 * Google OAuth requires secrets to be set in AWS Secrets Manager:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
        attributeMapping: {
          email: 'email',
          fullname: 'name',
          profilePicture: 'picture',
        },
      },
      callbackUrls: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'https://fpstrainer.com/',
        'https://fpstrainer.com/login',
        'https://www.fpstrainer.com/',
        'https://www.fpstrainer.com/login',
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'https://fpstrainer.com/',
        'https://www.fpstrainer.com/',
      ],
    },
  },
  // User attributes
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
