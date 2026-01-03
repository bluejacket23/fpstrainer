import { defineFunction } from '@aws-amplify/backend';

export const getThumbnailUrl = defineFunction({
  name: 'get-thumbnail-url',
  entry: './handler.ts',
  timeoutSeconds: 30,
});

