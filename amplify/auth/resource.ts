import { defineAuth } from '@aws-amplify/backend';

/**
 * Define authentication resource
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});

