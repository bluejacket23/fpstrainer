#!/usr/bin/env node

/**
 * Script to add S3 trigger to frame-extractor Lambda function
 * This configures S3 to automatically invoke frame-extractor when videos are uploaded
 */

const { LambdaClient, AddPermissionCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutBucketNotificationConfigurationCommand, GetBucketNotificationConfigurationCommand } = require('@aws-sdk/client-s3');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { execSync } = require('child_process');

const region = process.env.AWS_REGION || 'us-east-2';
const lambda = new LambdaClient({ region });
const s3 = new S3Client({ region });

async function getFunctionName() {
  try {
    // Try to get function name from Amplify output
    const output = execSync('npx ampx sandbox output --format json', { encoding: 'utf-8' });
    const outputs = JSON.parse(output);
    const functionName = outputs?.frameExtractorFunctionName || outputs?.frameExtractor?.functionName;
    if (functionName) return functionName;
  } catch (e) {
    console.log('Could not get function name from Amplify output, trying alternative...');
  }
  
  // Fallback: try to find function by name pattern
  try {
    const listOutput = execSync('aws lambda list-functions --region ' + region + ' --query "Functions[?contains(FunctionName, \'frame-extractor\')].FunctionName" --output text', { encoding: 'utf-8' });
    const names = listOutput.trim().split('\t').filter(Boolean);
    if (names.length > 0) {
      return names[0];
    }
  } catch (e) {
    console.error('Could not find function name:', e.message);
  }
  
  throw new Error('Could not determine frame-extractor function name. Please set FRAME_EXTRACTOR_FUNCTION_NAME environment variable.');
}

async function getBucketName() {
  try {
    // Try to get bucket name from Amplify output
    const output = execSync('npx ampx sandbox output --format json', { encoding: 'utf-8' });
    const outputs = JSON.parse(output);
    const bucketName = outputs?.storageBucketName || outputs?.storage?.bucketName;
    if (bucketName) return bucketName;
  } catch (e) {
    console.log('Could not get bucket name from Amplify output, trying alternative...');
  }
  
  // Fallback: try to find bucket by name pattern
  try {
    const listOutput = execSync('aws s3api list-buckets --region ' + region + ' --query "Buckets[?contains(Name, \'opscoach\') || contains(Name, \'storage\')].Name" --output text', { encoding: 'utf-8' });
    const names = listOutput.trim().split('\t').filter(Boolean);
    if (names.length > 0) {
      return names[0];
    }
  } catch (e) {
    console.error('Could not find bucket name:', e.message);
  }
  
  throw new Error('Could not determine storage bucket name. Please set STORAGE_BUCKET_NAME environment variable.');
}

async function addS3Trigger() {
  console.log('🔧 Adding S3 trigger to frame-extractor function...\n');
  
  const functionName = process.env.FRAME_EXTRACTOR_FUNCTION_NAME || await getFunctionName();
  const bucketName = process.env.STORAGE_BUCKET_NAME || await getBucketName();
  
  console.log(`Function: ${functionName}`);
  console.log(`Bucket: ${bucketName}\n`);
  
  // Step 1: Add permission for S3 to invoke Lambda
  console.log('1. Adding permission for S3 to invoke Lambda...');
  try {
    await lambda.send(new AddPermissionCommand({
      FunctionName: functionName,
      StatementId: `s3-trigger-${Date.now()}`,
      Action: 'lambda:InvokeFunction',
      Principal: 's3.amazonaws.com',
      SourceArn: `arn:aws:s3:::${bucketName}`,
    }));
    console.log('   ✅ Permission added\n');
  } catch (error) {
    if (error.name === 'ResourceConflictException') {
      console.log('   ⚠️  Permission already exists (this is OK)\n');
    } else {
      throw error;
    }
  }
  
  // Step 2: Get current notification configuration
  console.log('2. Getting current S3 notification configuration...');
  let currentConfig;
  try {
    const response = await s3.send(new GetBucketNotificationConfigurationCommand({
      Bucket: bucketName,
    }));
    currentConfig = response;
    console.log('   ✅ Current configuration retrieved\n');
  } catch (error) {
    console.error('   ❌ Error getting current configuration:', error.message);
    throw error;
  }
  
  // Step 3: Add Lambda function configuration
  console.log('3. Adding Lambda function to S3 notification configuration...');
  
  // Get AWS account ID
  const sts = new STSClient({ region });
  const identity = await sts.send(new GetCallerIdentityCommand({}));
  const accountId = identity.Account;
  
  const lambdaConfig = {
    LambdaFunctionArn: `arn:aws:lambda:${region}:${accountId}:function:${functionName}`,
    Events: ['s3:ObjectCreated:*'],
    Filter: {
      Key: {
        FilterRules: [
          { Name: 'prefix', Value: 'uploads/' },
          { Name: 'suffix', Value: '.mp4' },
        ],
      },
    },
  };
  
  // Merge with existing Lambda configurations
  const existingLambdaConfigs = currentConfig.LambdaFunctionConfigurations || [];
  const existingIndex = existingLambdaConfigs.findIndex(
    config => config.LambdaFunctionArn === lambdaConfig.LambdaFunctionArn
  );
  
  if (existingIndex >= 0) {
    console.log('   ⚠️  Lambda function already configured (updating...)');
    existingLambdaConfigs[existingIndex] = lambdaConfig;
  } else {
    existingLambdaConfigs.push(lambdaConfig);
  }
  
  // Update notification configuration
  try {
    await s3.send(new PutBucketNotificationConfigurationCommand({
      Bucket: bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: existingLambdaConfigs,
        QueueConfigurations: currentConfig.QueueConfigurations || [],
        TopicConfigurations: currentConfig.TopicConfigurations || [],
        EventBridgeConfiguration: currentConfig.EventBridgeConfiguration,
      },
    }));
    console.log('   ✅ S3 notification configuration updated\n');
  } catch (error) {
    console.error('   ❌ Error updating S3 notification configuration:', error.message);
    throw error;
  }
  
  console.log('✅ S3 trigger configured successfully!');
  console.log('\n📋 Configuration:');
  console.log(`   - Bucket: ${bucketName}`);
  console.log(`   - Prefix: uploads/`);
  console.log(`   - Suffix: .mp4`);
  console.log(`   - Event: s3:ObjectCreated:*`);
  console.log(`   - Lambda: ${functionName}`);
  console.log('\n🎉 Videos uploaded to uploads/*.mp4 will now automatically trigger frame extraction!');
}

// Run the script
addS3Trigger().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error('\n💡 Make sure you have:');
  console.error('   1. AWS credentials configured');
  console.error('   2. Amplify sandbox running (npx ampx sandbox)');
  console.error('   3. Or set FRAME_EXTRACTOR_FUNCTION_NAME and STORAGE_BUCKET_NAME environment variables');
  process.exit(1);
});

