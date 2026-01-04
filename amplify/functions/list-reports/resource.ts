import { defineFunction } from '@aws-amplify/backend';

export const listReports = defineFunction({
  name: 'list-reports',
  entry: './handler.ts',
  timeoutSeconds: 60, // Increased timeout for thumbnail refresh
  environment: {
    BUCKET_NAME: 'amplify-opscoach-lukec-sa-opscoachstoragebucket512-m7jbdrv5wfkw',
  },
});

