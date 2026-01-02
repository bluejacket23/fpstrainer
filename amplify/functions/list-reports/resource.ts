import { defineFunction } from '@aws-amplify/backend';

export const listReports = defineFunction({
  name: 'list-reports',
  entry: './handler.ts',
});

