import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import OpenAI from 'openai';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event: any) => {
  const { userId, reportId, frameKeys } = event;
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API Key');
    // Update status to FAILED
    if (TABLE_NAME) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { userId, reportId },
          UpdateExpression: 'SET processingStatus = :s',
          ExpressionAttributeValues: { ':s': 'FAILED' },
        }));
      } catch (e) {
        console.error('Error updating status to FAILED:', e);
      }
    }
    return;
  }
  
  // Initialize OpenAI client inside handler
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  
  try {
    console.log(`Starting analysis for ${reportId}`);
    
    // Update status to ANALYZING
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
      UpdateExpression: 'SET processingStatus = :s',
      ExpressionAttributeValues: { ':s': 'ANALYZING' },
    }));
    
    // Sample frames (every 2nd frame)
    const sampledKeys = frameKeys.filter((_: any, i: number) => i % 2 === 0);
    const imageUrls = await Promise.all(sampledKeys.map(async (key: string) => {
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
      return getSignedUrl(s3, command, { expiresIn: 3600 });
    }));
    
    const content: any[] = [
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

**YOUR ANALYTICAL APPROACH:**
You analyze gameplay with the expectation of PROFESSIONAL-LEVEL performance. Be CRITICAL but FAIR and CONSTRUCTIVE. You're coaching players who want to compete at the highest level. Point out mistakes, missed opportunities, and areas for improvement, but also acknowledge strong plays and good decision-making. Scores should reflect a balanced assessment - recognize excellent play when you see it, but don't inflate scores for average performance.

**SCORING STANDARDS:**
- Score like a professional coach evaluating gameplay fairly and accurately
- 90-100: Exceptional, near-perfect execution - professional tournament level
- 85-89: Excellent play with minor flaws - strong competitive level
- 75-84: Good play with some mistakes - solid fundamentals, room to refine
- 65-74: Average to decent play - functional but needs improvement in key areas
- 55-64: Below average - multiple areas need significant work
- Below 55: Poor performance - fundamental issues across the board
- Be HONEST and BALANCED. Acknowledge strong plays and good decisions, but also point out mistakes and areas for improvement.
- Professional/excellent players typically score 85-95. Good competitive players score 75-84. Average players score 65-74.
- ALL scores MUST be decimals with ONE decimal place (72.3, 68.7, NOT 72.0, 68.0)

Analyze the following sequence of frames from a player's clip (max 60s). 
Provide a deeply detailed, pro-level coaching breakdown in the EXACT order specified below:

**1. KEY MOMENTS BREAKDOWN** (MUST BE FIRST)
Provide specific timestamps (e.g., "At 0:13s...", "Between 0:19-0:21s...") identifying critical moments, mistakes, and strong plays. Format each moment with what happened and what should have been done differently.

**2. AIM & ACCURACY PERFORMANCE**
- Crosshair placement (height, centering, pre-aiming)
- First-shot accuracy, Tracking stability, Flick timing
- Recoil control, ADS timing, Reaction time tendencies
- Reticle discipline, Strafing aim quality
- Overflicking / underflicking patterns

**3. MOVEMENT & MECHANICS**
- Strafing technique, Slide timing/cancel
- Jump-shot usage, Sprint-to-fire delay awareness
- Rotation efficiency, Overexposing angles
- Movement predictability, Tactical sprint usage
- Bunny hop effectiveness, Peeking technique

**4. POSITIONING & MAP CONTROL**
- Holding vs pushing balance, Angle selection
- Elevation advantages, Line-of-sight exposure
- Use of cover (head-glitching, corner usage)
- Poor positions, Map lane awareness
- Death-prone habits, Distance control

**5. GAME SENSE & DECISION-MAKING**
- Predictability, Checking common angles
- Awareness checks (camera movement), Push vs back off timing
- Over-challenging losing fights, Situational awareness gaps
- Rotation timing, Reaction to sound cues
- Risky plays vs safe opportunities, Objective awareness

**6. ENGAGEMENT QUALITY**
- Opening shot timing, Fight initiations
- Pieing corners, Cover usage mid-fight
- Weapon swap speed, Reload timing mistakes
- Poor re-challenge opportunities
- Hipfire vs ADS decision accuracy

**7. WEAPON & LOADOUT OPTIMIZATION**
- Recommendations based on playstyle (Sensitivity, FOV, Class)
- Attachment swaps, Handling vs accuracy tradeoffs
- Sprint-to-fire weapon recommendations

**8. DEFENSE & SURVIVABILITY**
- Survival opportunities missed, Bad reload timing
- Staying in open lanes too long, Not checking blindsides
- Poor disengagement timing, Tunnel vision behavior

**9. ADVANCED METRICS**
- Estimate: Lane pressure (percentage), Time exposed vs cover (percentage)
- Tempo rating (Aggressive/Passive/Balanced with percentage)
- Predictability score, Mechanical consistency score
- Confidence rating

**10. PERSONALIZED COACHING FEEDBACK**
- Tailored weekly improvement plan
- Top 5 habits hurting the game
- Top 5 easy wins
- One-sentence playstyle summary
- Priority Focus area

**11. TRAINING DRILLS**
Provide specific drills with step-by-step instructions for improvement.

**OUTPUT FORMAT:**
You must output a JSON object containing a "scorecard" with decimal ratings out of 100 (e.g., 77.8, 68.3) for the categories below, and a "markdownReport" string.

IMPORTANT: Provide scores for as many categories as you can reasonably evaluate from the frames. If you cannot evaluate a specific metric, you may omit it, but always include: overallScore, aimAccuracy, movementMechanics, positioning, gameSense, engagementQuality, and survivability as minimum required scores.

The markdownReport MUST follow this EXACT format and order:
> PERFORMANCE ANALYSIS REPORT

🎯 KEY MOMENTS BREAKDOWN
[Your key moments with timestamps]

🎯 AIM & ACCURACY PERFORMANCE
[Detailed breakdown]

⚡ MOVEMENT & MECHANICS
[Detailed breakdown]

🗺️ POSITIONING & MAP CONTROL
[Detailed breakdown]

🧠 GAME SENSE & DECISION-MAKING
[Detailed breakdown]

⚔️ ENGAGEMENT QUALITY
[Detailed breakdown]

🔫 WEAPON & LOADOUT OPTIMIZATION
[Detailed breakdown]

🛡️ DEFENSE & SURVIVABILITY
[Detailed breakdown]

📊 ADVANCED METRICS
[Detailed breakdown with specific scores]

💡 PERSONALIZED COACHING FEEDBACK
[Weekly plan, habits, wins, playstyle summary, priority focus]

TRAINING DRILLS:
[Specific drills with steps]

Required JSON Structure (include as many metrics as you can evaluate):
{
  "scorecard": {
    "overallScore": number (one decimal place, REQUIRED),
    "aimAccuracy": number (REQUIRED),
    "movementMechanics": number (REQUIRED),
    "positioning": number (REQUIRED),
    "gameSense": number (REQUIRED),
    "engagementQuality": number (REQUIRED),
    "survivability": number (REQUIRED),
    "crosshairPlacement": number (optional but recommended),
    "firstShotAccuracy": number (optional),
    "trackingStability": number (optional),
    "flickTiming": number (optional),
    "recoilControl": number (optional),
    "adsTiming": number (optional),
    "reactionTime": number (optional),
    "reticleDiscipline": number (optional),
    "strafingAimQuality": number (optional),
    "strafingTechnique": number (optional),
    "slideTiming": number (optional),
    "jumpShotUsage": number (optional),
    "rotationEfficiency": number (optional),
    "peekingTechnique": number (optional),
    "angleSelection": number (optional),
    "coverUsage": number (optional),
    "mapAwareness": number (optional),
    "predictability": number (optional),
    "awarenessChecks": number (optional),
    "rotationTiming": number (optional),
    "situationalAwareness": number (optional),
    "openingShotTiming": number (optional),
    "fightInitiations": number (optional),
    "weaponSwapSpeed": number (optional),
    "reloadTiming": number (optional),
    "disengagementTiming": number (optional),
    "lanePressure": number (optional),
    "tempoRating": number (optional),
    "mechanicalConsistency": number (optional),
    "confidenceRating": number (optional)
  },
  "markdownReport": "The full markdown report text following the exact format above..."
}

The Markdown report should be professionally formatted with clear headers, bullet points, and bold text. Use emojis sparingly and only for section headers. Maintain a serious, analytical tone throughout.
`;
    
    content.push({ type: "text", text: promptText });
    
    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 8000, // Increased for detailed report
      response_format: { type: "json_object" }
    });
    
    console.log('OpenAI API response received');
    const resultText = response.choices[0].message.content || '{}';
    console.log('Response length:', resultText.length);
    console.log('Response preview:', resultText.substring(0, 200));
    
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
      console.log('JSON parsed successfully');
    } catch (parseError: any) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', resultText);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
    
    // Validate response structure
    if (!resultJson.scorecard) {
      console.error('Missing scorecard in response:', resultJson);
      throw new Error('Response missing scorecard field');
    }
    
    if (!resultJson.markdownReport) {
      console.error('Missing markdownReport in response:', resultJson);
      throw new Error('Response missing markdownReport field');
    }
    
    const aiReportJson = resultJson.scorecard;
    const aiReportMarkdown = resultJson.markdownReport;
    
    console.log('Scorecard keys:', Object.keys(aiReportJson));
    console.log('Markdown report length:', aiReportMarkdown.length);
    
    // Validate scorecard has required fields
    if (!aiReportJson.overallScore) {
      console.warn('Warning: overallScore missing, calculating from other scores');
      // Calculate average if missing
      const scores = Object.values(aiReportJson).filter(v => typeof v === 'number') as number[];
      if (scores.length > 0) {
        aiReportJson.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }
    
    // Update DB
    console.log('Updating database...');
    await docClient.send(new UpdateCommand({
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
    
    console.log('Analysis completed successfully');
  } catch (error: any) {
    console.error('AI Analysis failed:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      response: error?.response ? JSON.stringify(error.response, null, 2) : null,
      cause: error?.cause,
    });
    
    // Log OpenAI-specific errors
    if (error?.response) {
      console.error('OpenAI API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    try {
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, reportId },
        UpdateExpression: 'SET processingStatus = :s',
        ExpressionAttributeValues: { ':s': 'FAILED' },
      }));
      console.log('Status updated to FAILED');
    } catch (dbError) {
      console.error('Failed to update status to FAILED:', dbError);
    }
  }
};

