import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: any) => {
  console.log('List reports event:', JSON.stringify(event, null, 2));
  
  // AppSync Lambda resolver event structure
  // event.identity.sub contains the user ID
  const userId = event.identity?.sub || event.identity?.claims?.sub || event.arguments?.userId;
  
  console.log('Extracted userId:', userId);
  console.log('Event identity:', JSON.stringify(event.identity, null, 2));
  
  if (!userId) {
    console.error('No userId found in event:', JSON.stringify(event, null, 2));
    throw new Error('User ID is required');
  }
  
  if (!TABLE_NAME) {
    throw new Error('TABLE_NAME environment variable is not set');
  }
  
  try {
    // Query all reports for this userId
    // Since userId is the partition key, we can query directly
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      // Sort by timestamp descending (newest first)
      ScanIndexForward: false,
    }));
    
    console.log(`Found ${result.Items?.length || 0} reports for userId: ${userId}`);
    
    // Add createdAt and updatedAt if missing (for GraphQL compatibility)
    const items = (result.Items || []).map((item: any) => {
      const now = new Date().toISOString();
      return {
        ...item,
        createdAt: item.createdAt || item.timestamp || now,
        updatedAt: item.updatedAt || item.timestamp || now,
      };
    });
    
    return items;
  } catch (error) {
    console.error('Error querying reports:', error);
    throw new Error('Failed to fetch reports');
  }
};

