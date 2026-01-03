import { defineFunction } from '@aws-amplify/backend';

export const cleanupResources = defineFunction({
  name: 'cleanup-resources',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for cleanup
  memoryMB: 512,
});

