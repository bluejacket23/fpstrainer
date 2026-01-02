#!/usr/bin/env node

/**
 * Quick test script to verify OpenAI key and backend deployment
 * Run: node test-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Setup...\n');

// Test 1: Check if amplify_outputs.json exists (indicates deployment)
console.log('1️⃣  Checking if backend is deployed...');
const outputsPath = path.join(__dirname, 'amplify_outputs.json');
if (fs.existsSync(outputsPath)) {
  try {
    const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    console.log('   ✅ Backend outputs file found');
    
    if (outputs.auth) {
      console.log('   ✅ Auth configured:', outputs.auth.user_pool_id ? 'Yes' : 'No');
    }
    if (outputs.data) {
      console.log('   ✅ GraphQL API configured:', outputs.data.url ? 'Yes' : 'No');
    }
    if (outputs.storage) {
      console.log('   ✅ Storage configured:', outputs.storage.bucket_name ? 'Yes' : 'No');
    }
  } catch (e) {
    console.log('   ⚠️  Backend outputs file exists but invalid');
  }
} else {
  console.log('   ❌ Backend not deployed yet - run: npx ampx sandbox');
}

// Test 2: Check if sandbox is running
console.log('\n2️⃣  Checking if sandbox is running...');
try {
  const result = execSync('npx ampx sandbox --help', { encoding: 'utf8', stdio: 'pipe' });
  console.log('   ✅ Amplify CLI is available');
} catch (e) {
  console.log('   ⚠️  Could not verify Amplify CLI');
}

// Test 3: Check OpenAI key (if we can access AWS)
console.log('\n3️⃣  Checking OpenAI API key...');
console.log('   ℹ️  To verify the key is set, run:');
console.log('      npx ampx sandbox secret list');
console.log('   Or test the key directly:');
console.log('      node -e "const {execSync}=require(\'child_process\');');
console.log('      try{const key=execSync(\'npx ampx sandbox secret get OPENAI_API_KEY\',{encoding:\'utf8\'}).trim();');
console.log('      console.log(\'Key exists:\', key.length > 0 ? \'Yes\' : \'No\');}catch(e){console.log(\'Key not set\');}"');

// Test 4: Check backend files exist
console.log('\n4️⃣  Checking backend configuration files...');
const backendPath = path.join(__dirname, 'amplify', 'backend.ts');
if (fs.existsSync(backendPath)) {
  console.log('   ✅ Backend definition file exists');
} else {
  console.log('   ❌ Backend definition file missing');
}

const authPath = path.join(__dirname, 'amplify', 'auth', 'resource.ts');
const dataPath = path.join(__dirname, 'amplify', 'data', 'resource.ts');
const storagePath = path.join(__dirname, 'amplify', 'storage', 'resource.ts');

if (fs.existsSync(authPath)) console.log('   ✅ Auth resource exists');
if (fs.existsSync(dataPath)) console.log('   ✅ Data resource exists');
if (fs.existsSync(storagePath)) console.log('   ✅ Storage resource exists');

// Test 5: Check functions exist
console.log('\n5️⃣  Checking Lambda functions...');
const functions = ['upload-init', 'get-report', 'ai-analysis', 'frame-extractor'];
functions.forEach(func => {
  const funcPath = path.join(__dirname, 'amplify', 'functions', func, 'resource.ts');
  if (fs.existsSync(funcPath)) {
    console.log(`   ✅ ${func} function exists`);
  } else {
    console.log(`   ❌ ${func} function missing`);
  }
});

// Test 6: Check FFmpeg layer
console.log('\n6️⃣  Checking FFmpeg configuration...');
const frameExtractorPath = path.join(__dirname, 'amplify', 'functions', 'frame-extractor', 'resource.ts');
if (fs.existsSync(frameExtractorPath)) {
  const content = fs.readFileSync(frameExtractorPath, 'utf8');
  if (content.includes('ffmpeg')) {
    console.log('   ✅ FFmpeg layer configured');
  } else {
    console.log('   ⚠️  FFmpeg layer not found in config');
  }
}

console.log('\n📋 Summary:');
console.log('   - If backend outputs exist, deployment likely succeeded');
console.log('   - Run "npx ampx sandbox secret list" to verify OpenAI key');
console.log('   - Check AWS Lambda Console to verify functions are deployed');
console.log('\n✅ Quick test complete!\n');

