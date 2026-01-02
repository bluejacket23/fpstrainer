#!/usr/bin/env node

const { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { execSync } = require('child_process');
const fs = require('fs');

const region = 'us-east-2';
const logs = new CloudWatchLogsClient({ region });

// Read amplify_outputs.json to get function names
const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));

async function getLatestLogs(logGroupName) {
  try {
    console.log(`\n=== Checking ${logGroupName} ===\n`);
    
    // Get latest log stream
    const streamsResponse = await logs.send(new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 1,
    }));
    
    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      console.log('No log streams found');
      return;
    }
    
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    console.log(`Latest stream: ${logStreamName}\n`);
    
    // Get log events
    const eventsResponse = await logs.send(new GetLogEventsCommand({
      logGroupName,
      logStreamName,
      limit: 100,
    }));
    
    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      console.log('No log events found');
      return;
    }
    
    console.log('Recent logs:');
    console.log('─'.repeat(80));
    eventsResponse.events.forEach(event => {
      console.log(event.message);
    });
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error(`Error checking ${logGroupName}:`, error.message);
  }
}

async function main() {
  // Find Lambda functions
  console.log('Finding Lambda functions...');
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
    });
    
    console.log('Found functions:');
    Object.entries(functions).forEach(([name, fnName]) => {
      console.log(`  ${name}: ${fnName}`);
    });
  } catch (e) {
    console.error('Error finding functions:', e.message);
    process.exit(1);
  }
  
  // Check logs for each function
  if (functions['frame-extractor']) {
    await getLatestLogs(`/aws/lambda/${functions['frame-extractor']}`);
  }
  
  if (functions['ai-analysis']) {
    await getLatestLogs(`/aws/lambda/${functions['ai-analysis']}`);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

