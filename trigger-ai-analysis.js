#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { execSync } = require('child_process');

const region = 'us-east-2';
const lambda = new LambdaClient({ region });

// Get the reportId from command line or use the stuck one
const reportId = process.argv[2] || 'f21b3c34-bda2-4c82-886a-514b526be7e8';
const userId = process.argv[3] || 'd13b4560-a0e1-70db-9eb0-1ad515496f13';

async function triggerAI() {
  // Get frame-extractor function name
  let frameExtractorName;
  try {
    const listOutput = execSync(`aws lambda list-functions --region ${region}`, { encoding: 'utf8' });
    const funcList = JSON.parse(listOutput);
    const fn = funcList.Functions.find(f => f.FunctionName.toLowerCase().includes('frameextractor'));
    if (fn) {
      frameExtractorName = fn.FunctionName;
    }
  } catch (e) {
    console.error('Error finding function:', e.message);
    process.exit(1);
  }
  
  // Get frame keys from S3
  const bucketName = 'amplify-opscoach-lukec-sa-opscoachstoragebucket512-m7jbdrv5wfkw';
  let frameKeys = [];
  try {
    const listOutput = execSync(`aws s3 ls s3://${bucketName}/frames/${userId}/${reportId}/ --region ${region} --recursive`, { encoding: 'utf8' });
    frameKeys = listOutput.split('\n')
      .filter(line => line.trim() && line.includes('.jpg'))
      .map(line => line.split(/\s+/).pop())
      .filter(Boolean);
    console.log(`Found ${frameKeys.length} frames`);
  } catch (e) {
    console.error('Error listing frames:', e.message);
  }
  
  if (frameKeys.length === 0) {
    console.error('No frames found. Cannot trigger AI analysis.');
    process.exit(1);
  }
  
  // Get AI analysis function name
  let aiAnalysisName;
  try {
    const listOutput = execSync(`aws lambda list-functions --region ${region}`, { encoding: 'utf8' });
    const funcList = JSON.parse(listOutput);
    const fn = funcList.Functions.find(f => f.FunctionName.toLowerCase().includes('aianalysis'));
    if (fn) {
      aiAnalysisName = fn.FunctionName;
    }
  } catch (e) {
    console.error('Error finding AI analysis function:', e.message);
    process.exit(1);
  }
  
  console.log(`Triggering AI analysis for report ${reportId}...`);
  console.log(`Function: ${aiAnalysisName}`);
  console.log(`Frames: ${frameKeys.length}`);
  
  try {
    const response = await lambda.send(new InvokeCommand({
      FunctionName: aiAnalysisName,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        userId,
        reportId,
        frameKeys,
      }),
    }));
    
    console.log('✅ AI analysis triggered successfully');
    console.log(`Status: ${response.StatusCode}`);
  } catch (error) {
    console.error('❌ Error triggering AI analysis:', error.message);
    process.exit(1);
  }
}

triggerAI().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

