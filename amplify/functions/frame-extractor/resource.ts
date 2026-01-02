import { defineFunction } from '@aws-amplify/backend';

// FFmpeg Layer ARN for us-east-2
// Trying a different publicly accessible layer
// If this doesn't work, we'll add it manually via AWS Console
// Alternative sources:
// - https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
// - Search AWS Lambda console for public FFmpeg layers
// - Or create your own layer from: https://johnvansickle.com/ffmpeg/

// Try this ARN (may need to be added manually if permission issues persist)
// Common public layers by region - these may need to be added manually:
// us-east-1: arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4
// us-east-2: arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4
// us-west-2: arn:aws:lambda:us-west-2:145266761615:layer:ffmpeg:4

// For now, we'll deploy without the layer and add it manually via console
// This avoids permission issues during deployment
export const frameExtractor = defineFunction({
  name: 'frame-extractor',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 2048,
  // layers: ['arn:aws:lambda:us-east-2:145266761615:layer:ffmpeg:4'], // Add manually after deployment
});

