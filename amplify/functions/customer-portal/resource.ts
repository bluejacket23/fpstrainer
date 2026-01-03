import { defineFunction } from '@aws-amplify/backend';

export const customerPortal = defineFunction({
  name: 'customer-portal',
  entry: './handler.ts',
  timeoutSeconds: 30,
});

