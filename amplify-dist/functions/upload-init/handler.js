"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const ddb = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddb);
const s3 = new client_s3_1.S3Client({});
const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const handler = async (event) => {
    try {
        // AppSync resolver event structure
        const userId = event.identity?.sub;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const reportId = (0, uuid_1.v4)();
        const key = `uploads/${userId}/${reportId}.mp4`;
        // 1. Create DB Record
        const timestamp = new Date().toISOString();
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                userId,
                reportId,
                timestamp,
                processingStatus: 'UPLOADING',
                videoUrl: `s3://${BUCKET_NAME}/${key}`,
                frameUrls: [],
            }
        }));
        // 2. Generate Presigned URL
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: 'video/mp4',
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        return {
            uploadUrl,
            reportId,
            key
        };
    }
    catch (error) {
        console.error(error);
        throw new Error('Internal Server Error');
    }
};
exports.handler = handler;
