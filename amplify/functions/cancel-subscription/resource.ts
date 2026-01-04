import { defineFunction } from '@aws-amplify/backend';

export const cancelSubscription = defineFunction({
  name: 'cancel-subscription',
  entry: './handler.ts',
  timeoutSeconds: 30,
});


