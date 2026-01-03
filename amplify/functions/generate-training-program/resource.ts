import { defineFunction } from '@aws-amplify/backend';

export const generateTrainingProgram = defineFunction({
  name: 'generate-training-program',
  entry: './handler.ts',
  timeoutSeconds: 120,
});

