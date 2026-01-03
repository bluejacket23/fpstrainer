import { defineFunction } from '@aws-amplify/backend';

export const generateShareableGraphic = defineFunction({
  name: 'generate-shareable-graphic',
  entry: './handler.ts',
  timeoutSeconds: 60,
});

