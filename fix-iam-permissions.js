#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));
const region = outputs.auth.aws_region;
const bucketName = outputs.storage.bucket_name;

// Get table names
let tableName;
let userTableName;
try {
  const tables = execSync(`aws dynamodb list-tables --region ${region}`, { encoding: 'utf8' });
  const opsCoachMatch = tables.match(/OpsCoachReport[^\s"]*/);
  if (opsCoachMatch) {
    tableName = opsCoachMatch[0];
  }
  // Find User table - it might be User-xxx or Users-xxx
  const userMatch = tables.match(/User-[^\s"]*/);
  if (userMatch) {
    userTableName = userMatch[0];
  } else {
    // Fallback to Users if User- not found
    const usersMatch = tables.match(/Users[^\s"]*/);
    if (usersMatch) {
      userTableName = usersMatch[0];
    }
  }
} catch (e) {
  console.error('Could not find tables');
  process.exit(1);
}

// Find Lambda functions
let functions = {};
try {
  const listOutput = execSync(`aws lambda list-functions --region ${region}`, { encoding: 'utf8' });
  const funcList = JSON.parse(listOutput);
  
  funcList.Functions.forEach(fn => {
    const name = fn.FunctionName.toLowerCase();
    if (name.includes('frameextractor') || name.includes('frame-extractor')) {
      functions['frame-extractor'] = fn.FunctionName;
    }
    if (name.includes('aianalysis') || name.includes('ai-analysis')) {
      functions['ai-analysis'] = fn.FunctionName;
    }
    if (name.includes('listreports') || name.includes('list-reports')) {
      functions['list-reports'] = fn.FunctionName;
    }
    if (name.includes('uploadinit') || name.includes('upload-init')) {
      functions['upload-init'] = fn.FunctionName;
    }
  });
} catch (e) {
  console.error('Error finding functions:', e.message);
  process.exit(1);
}

async function addIAMPolicy(roleName, policyName, policy) {
  const policyFile = `temp-policy-${Date.now()}.json`;
  fs.writeFileSync(policyFile, JSON.stringify(policy, null, 2));
  
  try {
    execSync(`aws iam put-role-policy --role-name ${roleName} --policy-name ${policyName} --policy-document file://${policyFile}`, { stdio: 'inherit' });
    console.log(`✓ Added ${policyName} to ${roleName}`);
  } catch (e) {
    console.error(`✗ Failed to add ${policyName}:`, e.message);
  } finally {
    fs.unlinkSync(policyFile);
  }
}

async function main() {
  console.log('=== Fixing IAM Permissions ===\n');
  
  // Fix frame-extractor permissions
  if (functions['frame-extractor']) {
    console.log('Configuring frame-extractor IAM...');
    try {
      const funcInfo = execSync(`aws lambda get-function --function-name ${functions['frame-extractor']} --region ${region}`, { encoding: 'utf8' });
      const funcData = JSON.parse(funcInfo);
      const roleArn = funcData.Configuration.Role;
      const roleName = roleArn.split('/').pop();
      const accountId = roleArn.split(':')[4];
      
      // DynamoDB policy
      await addIAMPolicy(roleName, 'DynamoDBAccess', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
          Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
        }]
      });
      
      // S3 policy
      await addIAMPolicy(roleName, 'S3Access', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:PutObject'],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }]
      });
      
      // Lambda invoke policy
      if (functions['ai-analysis']) {
        await addIAMPolicy(roleName, 'LambdaInvokeAccess', {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: `arn:aws:lambda:${region}:${accountId}:function:${functions['ai-analysis']}`
          }]
        });
      }
    } catch (e) {
      console.error('Error configuring frame-extractor IAM:', e.message);
    }
  }
  
  // Fix list-reports permissions
  if (functions['list-reports'] && tableName) {
    console.log('\nConfiguring list-reports IAM...');
    try {
      const funcInfo = execSync(`aws lambda get-function --function-name ${functions['list-reports']} --region ${region}`, { encoding: 'utf8' });
      const funcData = JSON.parse(funcInfo);
      const roleArn = funcData.Configuration.Role;
      const roleName = roleArn.split('/').pop();
      const accountId = roleArn.split(':')[4];
      
      // DynamoDB query policy
      await addIAMPolicy(roleName, 'DynamoDBQueryAccess', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['dynamodb:Query'],
          Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
        }]
      });
    } catch (e) {
      console.error('Error configuring list-reports IAM:', e.message);
    }
  }
  
  // Fix ai-analysis permissions
  if (functions['ai-analysis']) {
    console.log('\nConfiguring ai-analysis IAM...');
    try {
      const funcInfo = execSync(`aws lambda get-function --function-name ${functions['ai-analysis']} --region ${region}`, { encoding: 'utf8' });
      const funcData = JSON.parse(funcInfo);
      const roleArn = funcData.Configuration.Role;
      const roleName = roleArn.split('/').pop();
      const accountId = roleArn.split(':')[4];
      
      // DynamoDB policy
      await addIAMPolicy(roleName, 'DynamoDBAccess', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
          Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
        }]
      });
      
      // S3 policy
      await addIAMPolicy(roleName, 'S3Access', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:PutObject'],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }]
      });
    } catch (e) {
      console.error('Error configuring ai-analysis IAM:', e.message);
    }
  }
  
  // Fix upload-init permissions
  if (functions['upload-init']) {
    console.log('\nConfiguring upload-init IAM...');
    try {
      const funcInfo = execSync(`aws lambda get-function --function-name ${functions['upload-init']} --region ${region}`, { encoding: 'utf8' });
      const funcData = JSON.parse(funcInfo);
      const roleArn = funcData.Configuration.Role;
      const roleName = roleArn.split('/').pop();
      const accountId = roleArn.split(':')[4];
      
      // DynamoDB policy for OpsCoachReport table
      if (tableName) {
        await addIAMPolicy(roleName, 'DynamoDBReportAccess', {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
            Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
          }]
        });
      }
      
      // DynamoDB policy for User table (for clip tracking)
      if (userTableName) {
        await addIAMPolicy(roleName, 'DynamoDBUserAccess', {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${userTableName}`
          }]
        });
      }
      
      // S3 policy
      await addIAMPolicy(roleName, 'S3Access', {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:PutObject', 's3:GetObject'],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }]
      });
    } catch (e) {
      console.error('Error configuring upload-init IAM:', e.message);
    }
  }
  
  console.log('\n=== Done! ===\n');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

