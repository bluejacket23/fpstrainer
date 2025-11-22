"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const ddb = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddb);
const TABLE_NAME = process.env.TABLE_NAME;
const handler = async (event) => {
    const { userId, reportId } = event.arguments;
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
        }));
        return result.Item;
    }
    catch (error) {
        console.error(error);
        throw new Error('Failed to fetch report');
    }
};
exports.handler = handler;
