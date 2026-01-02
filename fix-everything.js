#!/usr/bin/env node

/**
 * Quick Auto-Config Script
 * Automatically configures all Lambda functions with environment variables and IAM permissions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { LambdaClient, AddPermissionCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutBucketNotificationConfigurationCommand, GetBucketNotificationConfigurationCommand } = require('@aws-sdk/client-s3');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

// Main async function
async function main() {
// Read amplify_outputs.json
const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));
const region = outputs.auth.aws_region;
const bucketName = outputs.storage.bucket_name;

console.log('\n=== Auto-Configuring Lambda Functions ===\n');
console.log(`Region: ${region}`);
console.log(`Bucket: ${bucketName}\n`);

// Get table name from DynamoDB
console.log('Finding DynamoDB table...');
let tableName;
try {
  const tables = execSync(`aws dynamodb list-tables --region ${region}`, { encoding: 'utf8' });
  const tableMatch = tables.match(/OpsCoachReport[^\s"]*/);
  if (tableMatch) {
    tableName = tableMatch[0];
    console.log(`✓ Found table: ${tableName}\n`);
  }
} catch (e) {
  console.log('⚠️  Could not auto-detect table name. You may need to set it manually.\n');
}

// Get OpenAI key from secrets
console.log('Getting OpenAI API key...');
let openaiKey;
try {
  const secretOutput = execSync('npx ampx sandbox secret get OPENAI_API_KEY', { encoding: 'utf8', stdio: 'pipe' });
  const match = secretOutput.match(/Value:\s*(.+)/);
  if (match) {
    openaiKey = match[1].trim();
    console.log('✓ Got OpenAI key\n');
  }
} catch (e) {
  console.log('⚠️  Could not get OpenAI key from secrets\n');
}

// Find Lambda functions
console.log('Finding Lambda functions...');
let functions = {};
try {
  const listOutput = execSync(`aws lambda list-functions --region ${region}`, { encoding: 'utf8' });
  const funcList = JSON.parse(listOutput);
  
  funcList.Functions.forEach(fn => {
    const name = fn.FunctionName.toLowerCase();
    if (name.includes('uploadinit') || name.includes('upload-init')) functions['upload-init'] = fn.FunctionName;
    if (name.includes('frameextractor') || name.includes('frame-extractor')) functions['frame-extractor'] = fn.FunctionName;
    if (name.includes('aianalysis') || name.includes('ai-analysis')) functions['ai-analysis'] = fn.FunctionName;
    if (name.includes('getreport') || name.includes('get-report')) functions['get-report'] = fn.FunctionName;
    if (name.includes('listreports') || name.includes('list-reports')) functions['list-reports'] = fn.FunctionName;
    if (name.includes('completemultipart') || name.includes('complete-multipart')) functions['complete-multipart-upload'] = fn.FunctionName;
  });
  
  Object.entries(functions).forEach(([name, fnName]) => {
    console.log(`✓ ${name}: ${fnName}`);
  });
  console.log('');
} catch (e) {
  console.log('✗ Error finding functions:', e.message);
  process.exit(1);
}

// Configure environment variables
console.log('=== Setting Environment Variables ===\n');

if (functions['upload-init'] && tableName && bucketName) {
  console.log('Configuring upload-init...');
  execSync(`aws lambda update-function-configuration --function-name ${functions['upload-init']} --environment "Variables={TABLE_NAME=${tableName},BUCKET_NAME=${bucketName}}" --region ${region}`, { stdio: 'inherit' });
}

if (functions['get-report'] && tableName) {
  console.log('Configuring get-report...');
  execSync(`aws lambda update-function-configuration --function-name ${functions['get-report']} --environment "Variables={TABLE_NAME=${tableName}}" --region ${region}`, { stdio: 'inherit' });
}

if (functions['list-reports'] && tableName) {
  console.log('Configuring list-reports...');
  execSync(`aws lambda update-function-configuration --function-name ${functions['list-reports']} --environment "Variables={TABLE_NAME=${tableName}}" --region ${region}`, { stdio: 'inherit' });
}

if (functions['ai-analysis'] && tableName && bucketName) {
  console.log('Configuring ai-analysis...');
  // Get OpenAI key from secrets if not already retrieved
  if (!openaiKey) {
    try {
      const secretOutput = execSync('npx ampx sandbox secret get OPENAI_API_KEY', { encoding: 'utf8', stdio: 'pipe' });
      const match = secretOutput.match(/value:\s*(.+)/i);
      if (match) {
        openaiKey = match[1].trim();
        console.log('✓ Got OpenAI key from secrets');
      }
    } catch (e) {
      console.log('⚠️  Could not get OpenAI key from secrets');
    }
  }
  const envVars = `TABLE_NAME=${tableName},BUCKET_NAME=${bucketName}`;
  const envVarsWithKey = openaiKey ? `${envVars},OPENAI_API_KEY=${openaiKey}` : envVars;
  execSync(`aws lambda update-function-configuration --function-name ${functions['ai-analysis']} --environment "Variables={${envVarsWithKey}}" --region ${region}`, { stdio: 'inherit' });
}

if (functions['frame-extractor'] && bucketName && functions['ai-analysis'] && tableName) {
  console.log('Configuring frame-extractor...');
  execSync(`aws lambda update-function-configuration --function-name ${functions['frame-extractor']} --environment "Variables={BUCKET_NAME=${bucketName},AI_FUNCTION_NAME=${functions['ai-analysis']},TABLE_NAME=${tableName}}" --region ${region}`, { stdio: 'inherit' });
}

if (functions['complete-multipart-upload'] && bucketName) {
  console.log('Configuring complete-multipart-upload...');
  execSync(`aws lambda update-function-configuration --function-name ${functions['complete-multipart-upload']} --environment "Variables={BUCKET_NAME=${bucketName}}" --region ${region}`, { stdio: 'inherit' });
}

// Get IAM roles and add policies
console.log('\n=== Configuring IAM Permissions ===\n');

if (functions['ai-analysis'] && tableName && bucketName) {
  console.log('Configuring IAM for ai-analysis...');
  try {
    // Get role name
    const funcInfo = execSync(`aws lambda get-function --function-name ${functions['ai-analysis']} --region ${region}`, { encoding: 'utf8' });
    const funcData = JSON.parse(funcInfo);
    const roleArn = funcData.Configuration.Role;
    const roleName = roleArn.split('/').pop();
    const accountId = roleArn.split(':')[4];
    
    // Add DynamoDB policy
    const dynamoPolicy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
        Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
      }]
    };
    
    const dynamoPolicyDoc = JSON.stringify(dynamoPolicy).replace(/'/g, "\\'");
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name DynamoDBAccess --policy-document '${dynamoPolicyDoc}'`, { stdio: 'inherit' });
    console.log('✓ Added DynamoDB policy');
    
    // Add S3 policy
    const s3Policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject'],
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    
    const s3PolicyDoc = JSON.stringify(s3Policy).replace(/'/g, "\\'");
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name S3Access --policy-document '${s3PolicyDoc}'`, { stdio: 'inherit' });
    console.log('✓ Added S3 policy');
  } catch (e) {
    console.log('⚠️  Could not configure IAM:', e.message);
  }
}

if (functions['frame-extractor'] && tableName && bucketName) {
  console.log('Configuring IAM for frame-extractor...');
  try {
    const funcInfo = execSync(`aws lambda get-function --function-name ${functions['frame-extractor']} --region ${region}`, { encoding: 'utf8' });
    const funcData = JSON.parse(funcInfo);
    const roleArn = funcData.Configuration.Role;
    const roleName = roleArn.split('/').pop();
    const accountId = roleArn.split(':')[4];
    
    // Add DynamoDB policy
    const dynamoPolicy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
        Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
      }]
    };
    
    const policyDoc = JSON.stringify(dynamoPolicy).replace(/'/g, "\\'");
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name DynamoDBAccess --policy-document '${policyDoc}'`, { stdio: 'inherit' });
    console.log('✓ Added DynamoDB policy');
    
    // Add S3 policy
    const s3Policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject'],
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    
    const s3PolicyDoc = JSON.stringify(s3Policy).replace(/'/g, "\\'");
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name S3Access --policy-document '${s3PolicyDoc}'`, { stdio: 'inherit' });
    console.log('✓ Added S3 policy');
    
    // Add Lambda invoke policy
    if (functions['ai-analysis']) {
      const lambdaPolicy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['lambda:InvokeFunction'],
          Resource: `arn:aws:lambda:${region}:${accountId}:function:${functions['ai-analysis']}`
        }]
      };
      
      const lambdaPolicyDoc = JSON.stringify(lambdaPolicy).replace(/'/g, "\\'");
      execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name LambdaInvokeAccess --policy-document '${lambdaPolicyDoc}'`, { stdio: 'inherit' });
      console.log('✓ Added Lambda invoke policy');
    }
  } catch (e) {
    console.log('⚠️  Could not configure IAM:', e.message);
  }
}

if (functions['complete-multipart-upload'] && bucketName) {
  console.log('Configuring IAM for complete-multipart-upload...');
  try {
    const funcInfo = execSync(`aws lambda get-function --function-name ${functions['complete-multipart-upload']} --region ${region}`, { encoding: 'utf8' });
    const funcData = JSON.parse(funcInfo);
    const roleArn = funcData.Configuration.Role;
    const roleName = roleArn.split('/').pop();
    
    const s3Policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:GetObject', 's3:CompleteMultipartUpload', 's3:AbortMultipartUpload', 's3:ListMultipartUploadParts'],
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    
    const policyDoc = JSON.stringify(s3Policy).replace(/'/g, "\\'");
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name S3MultipartAccess --policy-document '${policyDoc}'`, { stdio: 'inherit' });
    console.log('✓ Added S3 multipart policy');
  } catch (e) {
    console.log('⚠️  Could not configure IAM:', e.message);
  }
}

// Configure S3 trigger for frame-extractor
console.log('\n=== Configuring S3 Trigger ===\n');

if (functions['frame-extractor'] && bucketName) {
  console.log('Setting up S3 trigger for frame-extractor...');
  
  const lambda = new LambdaClient({ region });
  const s3 = new S3Client({ region });
  const sts = new STSClient({ region });
  
  try {
    // Get AWS account ID
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    const accountId = identity.Account;
    const functionName = functions['frame-extractor'];
    const lambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${functionName}`;
    
    // Step 1: Add permission for S3 to invoke Lambda
    console.log('Adding permission for S3 to invoke Lambda...');
    try {
      await lambda.send(new AddPermissionCommand({
        FunctionName: functionName,
        StatementId: `s3-trigger-${Date.now()}`,
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
        SourceArn: `arn:aws:s3:::${bucketName}`,
      }));
      console.log('✓ Permission added');
    } catch (error) {
      if (error.name === 'ResourceConflictException') {
        console.log('⚠️  Permission already exists (this is OK)');
      } else {
        throw error;
      }
    }
    
    // Step 2: Get current notification configuration
    console.log('Getting current S3 notification configuration...');
    const currentConfig = await s3.send(new GetBucketNotificationConfigurationCommand({
      Bucket: bucketName,
    }));
    
    // Step 3: Add Lambda function configuration
    console.log('Adding Lambda function to S3 notification configuration...');
    
    const lambdaConfig = {
      LambdaFunctionArn: lambdaArn,
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
      config => config.LambdaFunctionArn === lambdaArn
    );
    
    if (existingIndex >= 0) {
      console.log('⚠️  Lambda function already configured (updating...)');
      existingLambdaConfigs[existingIndex] = lambdaConfig;
    } else {
      existingLambdaConfigs.push(lambdaConfig);
    }
    
    // Update notification configuration
    await s3.send(new PutBucketNotificationConfigurationCommand({
      Bucket: bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: existingLambdaConfigs,
        QueueConfigurations: currentConfig.QueueConfigurations || [],
        TopicConfigurations: currentConfig.TopicConfigurations || [],
        EventBridgeConfiguration: currentConfig.EventBridgeConfiguration,
      },
    }));
    console.log('✓ S3 trigger configured successfully');
    console.log(`  - Bucket: ${bucketName}`);
    console.log(`  - Prefix: uploads/`);
    console.log(`  - Suffix: .mp4`);
    console.log(`  - Lambda: ${functionName}`);
  } catch (error) {
    console.log(`⚠️  Could not configure S3 trigger: ${error.message}`);
    console.log('   You may need to configure it manually in the AWS Console');
  }
} else {
  console.log('⚠️  Skipping S3 trigger (frame-extractor function not found)');
}

console.log('\n=== Done! ===\n');
console.log('All functions configured. You can now test your app.\n');
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});


