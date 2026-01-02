import { defineFunction } from '@aws-amplify/backend';

export const uploadInit = defineFunction({
  name: 'upload-init',
  entry: './handler.ts',
  timeoutSeconds: 30,
});

