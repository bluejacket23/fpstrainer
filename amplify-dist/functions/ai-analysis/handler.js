"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const openai_1 = __importDefault(require("openai"));
const ddb = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddb);
const s3 = new client_s3_1.S3Client({});
const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
const handler = async (event) => {
    const { userId, reportId, frameKeys } = event;
    if (!OPENAI_API_KEY) {
        console.error('Missing OpenAI API Key');
        return;
    }
    try {
        console.log(`Starting analysis for ${reportId}`);
        // Update status to ANALYZING
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
            UpdateExpression: 'SET processingStatus = :s',
            ExpressionAttributeValues: { ':s': 'ANALYZING' },
        }));
        // Sample frames (every 2nd frame)
        const sampledKeys = frameKeys.filter((_, i) => i % 2 === 0);
        const imageUrls = await Promise.all(sampledKeys.map(async (key) => {
            const command = new client_s3_1.GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
            return (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        }));
        const content = [
            { type: "text", text: "Analyze the following sequence of frames from a player's gameplay clip." }
        ];
        for (const url of imageUrls) {
            content.push({
                type: "image_url",
                image_url: {
                    url: url,
                    detail: "low"
                }
            });
        }
        const promptText = `
You are FpsTrainer, an elite AI gameplay analyst for tactical FPS games.

Analyze the following sequence of frames from a player's clip (max 60s). 
Provide a deeply detailed, pro-level coaching breakdown covering these 10 dimensions:

1. **AIM & ACCURACY PERFORMANCE**
   - Crosshair placement (height, centering, pre-aiming)
   - First-shot accuracy, Tracking stability, Flick timing
   - Recoil control, ADS timing, Reaction time tendencies
   - Reticle discipline, Strafing aim quality
   - Overflicking / underflicking patterns

2. **MOVEMENT & MECHANICS**
   - Strafing technique, Slide timing/cancel
   - Jump-shot usage, Sprint-to-fire delay awareness
   - Rotation efficiency, Overexposing angles
   - Movement predictability, Tactical sprint usage
   - Bunny hop effectiveness, Peeking technique

3. **POSITIONING & MAP CONTROL**
   - Holding vs pushing balance, Angle selection
   - Elevation advantages, Line-of-sight exposure
   - Use of cover (head-glitching, corner usage)
   - Poor positions, Map lane awareness
   - Death-prone habits, Distance control

4. **GAME SENSE & DECISION-MAKING**
   - Predictability, Checking common angles
   - Awareness checks (camera movement), Push vs back off timing
   - Over-challenging losing fights, Situational awareness gaps
   - Rotation timing, Reaction to sound cues
   - Risky plays vs safe opportunities, Objective awareness

5. **ENGAGEMENT QUALITY**
   - Opening shot timing, Fight initiations
   - Pieing corners, Cover usage mid-fight
   - Weapon swap speed, Reload timing mistakes
   - Poor re-challenge opportunities
   - Hipfire vs ADS decision accuracy

6. **WEAPON & LOADOUT OPTIMIZATION**
   - Recommendations based on playstyle (Sensitivity, FOV, Class)
   - Attachment swaps, Handling vs accuracy tradeoffs
   - Sprint-to-fire weapon recommendations

7. **DEFENSE & SURVIVABILITY**
   - Survival opportunities missed, Bad reload timing
   - Staying in open lanes too long, Not checking blindsides
   - Poor disengagement timing, Tunnel vision behavior

8. **ADVANCED METRICS**
   - Estimate: Lane pressure, Time exposed vs cover
   - Tempo rating (Aggressive/Passive/Balanced)
   - Predictability score, Mechanical consistency score
   - Confidence rating

9. **CLIP-SPECIFIC MOMENTS**
   - Provide specific timestamps (e.g., "At 14s...") identifying mistakes.

10. **PERSONALIZED COACHING FEEDBACK**
    - Tailored weekly improvement plan
    - Top 5 habits hurting the game
    - Top 5 easy wins
    - One-sentence playstyle summary

**OUTPUT FORMAT:**
You must output a JSON object containing a "scorecard" with decimal ratings out of 100 (e.g., 77.8) for key categories, and a "markdownReport" string.

Required JSON Structure:
{
  "scorecard": {
    "overallScore": number,
    "aimAccuracy": number,
    "movementMechanics": number,
    "positioning": number,
    "gameSense": number,
    "engagementQuality": number,
    "survivability": number
  },
  "markdownReport": "The full markdown report text..."
}

The Markdown report should be beautifully formatted with headers, bullet points, and bold text. Use emojis where appropriate.
`;
        content.push({ type: "text", text: promptText });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: content,
                },
            ],
            max_tokens: 4000,
            response_format: { type: "json_object" }
        });
        const resultText = response.choices[0].message.content || '{}';
        const resultJson = JSON.parse(resultText);
        const aiReportJson = resultJson.scorecard;
        const aiReportMarkdown = resultJson.markdownReport;
        // Update DB
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
            UpdateExpression: 'SET processingStatus = :s, aiReportJson = :j, aiReportMarkdown = :m, frameUrls = :f',
            ExpressionAttributeValues: {
                ':s': 'COMPLETED',
                ':j': aiReportJson,
                ':m': aiReportMarkdown,
                ':f': frameKeys,
            },
        }));
        console.log('Analysis completed');
    }
    catch (error) {
        console.error('AI Analysis failed:', error);
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId, reportId },
            UpdateExpression: 'SET processingStatus = :s',
            ExpressionAttributeValues: { ':s': 'FAILED' },
        }));
    }
};
exports.handler = handler;
