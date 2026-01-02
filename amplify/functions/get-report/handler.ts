import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: any) => {
  const { userId, reportId } = event.arguments;
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    return result.Item;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch report');
  }
};

