import { defineFunction } from '@aws-amplify/backend';

export const getReport = defineFunction({
  name: 'get-report',
  entry: './handler.ts',
});

