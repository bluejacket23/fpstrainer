import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * FPSTrainer Authentication Configuration
 * 
 * Supports:
 * - Email/password sign-in
 * - Google OAuth sign-in
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
        'https://fpstrainer.io/',
        'https://fpstrainer.io/login',
        'https://www.fpstrainer.io/',
        'https://www.fpstrainer.io/login',
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'https://fpstrainer.io/',
        'https://www.fpstrainer.io/',
      ],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
