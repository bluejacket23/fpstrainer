"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("stream/promises");
// @ts-ignore
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
// NOTE: Ensure an FFmpeg Lambda Layer is attached to this function.
// If using a static binary, set FFMPEG_PATH.
// ffmpeg.setFfmpegPath('/opt/bin/ffmpeg'); // Example for layer
const s3 = new client_s3_1.S3Client({});
const lambda = new client_lambda_1.LambdaClient({});
const BUCKET_NAME = process.env.BUCKET_NAME;
const AI_FUNCTION_NAME = process.env.AI_FUNCTION_NAME;
const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        // S3 keys are URL encoded
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        // Expected key format: uploads/{userId}/{reportId}.mp4
        const parts = key.split('/');
        if (parts.length !== 3 || parts[0] !== 'uploads') {
            console.log('Skipping key:', key);
            continue;
        }
        const userId = parts[1];
        const reportId = path.basename(parts[2], '.mp4'); // removes extension
        try {
            console.log(`Processing ${key} for user ${userId}`);
            const localInput = `/tmp/${reportId}.mp4`;
            const outputDir = `/tmp/frames-${reportId}`;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }
            // 1. Download Video
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });
            const response = await s3.send(getCommand);
            if (!response.Body)
                throw new Error('No body in S3 response');
            await (0, promises_1.pipeline)(response.Body, fs.createWriteStream(localInput));
            console.log('Video downloaded');
            // 2. Extract Frames (1 frame per second)
            // We need to point to the ffmpeg binary if it's in a layer
            // Usually layers put it in /opt/bin/ffmpeg
            if (fs.existsSync('/opt/bin/ffmpeg')) {
                fluent_ffmpeg_1.default.setFfmpegPath('/opt/bin/ffmpeg');
            }
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(localInput)
                    .outputOptions('-vf', 'fps=1') // 1 frame per second
                    .output(`${outputDir}/frame_%03d.jpg`)
                    .on('end', resolve)
                    .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                    .run();
            });
            console.log('Frames extracted');
            // 3. Upload Frames
            const files = fs.readdirSync(outputDir);
            const frameKeys = [];
            // Sort files to ensure order
            files.sort();
            for (const file of files) {
                const fileStream = fs.createReadStream(path.join(outputDir, file));
                const frameKey = `frames/${userId}/${reportId}/${file}`;
                await s3.send(new client_s3_1.PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: frameKey,
                    Body: fileStream,
                    ContentType: 'image/jpeg',
                }));
                frameKeys.push(frameKey);
            }
            console.log(`Uploaded ${frameKeys.length} frames`);
            // 4. Cleanup
            try {
                fs.unlinkSync(localInput);
                fs.rmSync(outputDir, { recursive: true, force: true });
            }
            catch (e) {
                console.warn('Cleanup warning:', e);
            }
            // 5. Invoke AI Analysis
            await lambda.send(new client_lambda_1.InvokeCommand({
                FunctionName: AI_FUNCTION_NAME,
                InvocationType: 'Event', // Async
                Payload: JSON.stringify({
                    userId,
                    reportId,
                    frameKeys,
                }),
            }));
            console.log('Invoked AI Analysis');
        }
        catch (error) {
            console.error('Error processing video:', error);
            // In a real app, we'd update the DB status to FAILED here
        }
    }
};
exports.handler = handler;
