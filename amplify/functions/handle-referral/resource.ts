import { defineFunction } from '@aws-amplify/backend';

export const handleReferral = defineFunction({
  name: 'handle-referral',
  entry: './handler.ts',
  timeoutSeconds: 30,
});

