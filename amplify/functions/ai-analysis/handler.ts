import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import OpenAI from 'openai';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({});
const lambda = new LambdaClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const CLEANUP_FUNCTION_NAME = process.env.CLEANUP_FUNCTION_NAME;

export const handler = async (event: any) => {
  const { userId, reportId, frameKeys, videoDuration } = event;
  
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
    
    // Use ALL frames (1 per second) for maximum timestamp accuracy
    // Generate signed URLs in parallel for speed
    const imageUrls = await Promise.all(frameKeys.map(async (key: string) => {
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
      return getSignedUrl(s3, command, { expiresIn: 3600 });
    }));
    
    // Calculate timing info - each frame = 1 second
    const totalFrames = frameKeys.length;
    const actualDuration = videoDuration || totalFrames;
    
    const content: any[] = [
      { type: "text", text: `GAMEPLAY ANALYSIS - ${totalFrames} frames from a ${actualDuration}-second clip.

IMPORTANT: Each frame has the TIMESTAMP BURNED INTO THE TOP-LEFT CORNER of the image.
Look at the top-left of each frame - you will see "0s", "1s", "2s", etc.
READ THIS VISIBLE TIMESTAMP to know exactly when each moment happens.` }
    ];
    
    // Add ALL frames - timestamps are burned into the images themselves
    for (let i = 0; i < imageUrls.length; i++) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrls[i],
          detail: "low"
        }
      });
    }
    
    const promptText = `
You are FpsTrainer, an elite AI gameplay analyst for tactical FPS games.

**CRITICAL TIMING INFORMATION:**
Each frame has the EXACT TIMESTAMP BURNED INTO THE IMAGE in the TOP-LEFT corner (e.g., "0s", "5s", "12s", "28s").
- LOOK AT THE TOP-LEFT of each frame - you will SEE the timestamp displayed on the image itself
- The number shown IS the exact second in the video
- If you see "12s" in the corner, the timestamp is 0:12s
- If you see "28s" in the corner, the timestamp is 0:28s
- DO NOT GUESS. READ THE VISIBLE TIMESTAMP FROM EACH FRAME.

**YOUR ANALYTICAL APPROACH:**
You analyze gameplay like a professional esports coach reviewing VODs. Be TECHNICAL and SPECIFIC.

**USE FPS TERMINOLOGY:**
- Crosshair placement (head height, pre-aim angles, micro-adjustments)
- Movement mechanics (counter-strafe, jiggle peek, wide swing, shoulder peek)
- Positioning (off-angle, trade position, isolation, cross-fire setup)
- Timing (TTK, reaction time, peek timing, reload timing, rotation timing)
- Engagement quality (first-bullet accuracy, spray control, trade potential)

**BALANCED ANALYSIS:** Include both strong mechanics and areas for improvement naturally. No need for labels like "GOOD:" - just describe what happened technically.

**SCORING STANDARDS:**
- 90-100: Exceptional, professional tournament level (rare)
- 80-89: Excellent play, strong competitive level
- 70-79: Good play with room to improve
- 60-69: Average, functional but needs work
- 50-59: Below average, significant improvement needed
- Below 50: Poor, fundamental issues

**CRITICAL SCORING RULES:**
1. ALL scores MUST have ONE decimal place (72.3, 68.7, NOT 72.0, 68.0)
2. **SCORES MUST VARY WIDELY** - Your lowest score should be AT LEAST 15-20 points below your highest score
3. Example: If overallScore is 75, individual scores should range from ~60 to ~88
4. Some categories the player will be GOOD at, others they will be WEAK at - reflect this!
5. DO NOT cluster all scores within 5-10 points of each other
6. A player might have 85 aim but 62 positioning - scores should reflect actual skill differences

Analyze the ${totalFrames} frames from this ${actualDuration}-second gameplay clip.
Provide a deeply detailed, pro-level coaching breakdown in the EXACT order specified below:

**1. KEY MOMENTS BREAKDOWN** (MUST BE FIRST)
Identify SIGNIFICANT gameplay moments - engagements, kills, deaths, positioning decisions, mechanical plays.

**TIMESTAMP ACCURACY:** READ THE TIMESTAMP FROM THE TOP-LEFT CORNER OF EACH FRAME IMAGE.
- Each frame has "Xs" burned into the top-left (e.g., "5s", "12s", "28s")
- If you see action in a frame showing "12s" in the corner, use timestamp 0:12s
- If you see action in a frame showing "28s" in the corner, use timestamp 0:28s
- The timestamp is VISIBLE ON THE IMAGE - just read it

**BE TECHNICAL AND SPECIFIC:** Use precise FPS terminology - crosshair placement height, strafe direction, peek timing, TTK, damage trade, angle isolation, etc.

Format (read timestamps from images, technical analysis):
> 0:12s - Player executed a clean flick to secure the elimination. Crosshair was pre-positioned at head height on the common peek angle, minimizing adjustment distance. Clean trigger discipline with controlled burst fire.

> 0:28s - Player over-extended past cover while reloading, exposing to a 90-degree cross-angle. Should have repositioned to hard cover before the magazine swap to avoid the trade.

REQUIREMENTS:
- READ the visible timestamp from the top-left corner of each frame
- Include both strong plays and mistakes naturally
- Be TECHNICAL - reference specific mechanics, timings, angles, positioning concepts
- 5-10 key moments based on actual events

**2. AIM & ACCURACY PERFORMANCE**
For each aspect, provide DETAILED analysis with:
- Specific observations from the gameplay
- WHY this is good or bad (reasoning)
- What the player did correctly or incorrectly
- How this impacts their performance
- Specific examples from the clip with timestamps when relevant

Cover: Crosshair placement (height, centering, pre-aiming), First-shot accuracy, Tracking stability, Flick timing, Recoil control, ADS timing, Reaction time tendencies, Reticle discipline, Strafing aim quality, Overflicking / underflicking patterns

Each bullet point should be DETAILED with explanations, not just brief statements.

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
- Tailored weekly improvement plan (with specific reasoning for why each focus area matters)
- Top 5 habits hurting the game (with explanations of WHY each habit is problematic and its impact)
- Top 5 easy wins (with explanations of HOW to implement and WHY these will help)
- Priority Focus area (the single most important thing to work on, with detailed reasoning)

**11. TRAINING DRILLS**
Provide specific drills with step-by-step instructions for improvement.

**OUTPUT FORMAT:**
You must output a JSON object containing a "scorecard" with decimal ratings out of 100 (e.g., 77.8, 68.3) for the categories below, and a "markdownReport" string.

IMPORTANT: Provide scores for ALL categories listed below. Each metric should be evaluated independently based on what you observed. Scores should vary significantly - don't cluster them around the same value. Aim for at least 15-20 point variance between your highest and lowest individual scores.

The markdownReport MUST follow this EXACT format and order. Use ">" for ALL bullet points (NO dashes, NO asterisks, ONLY ">"), NO emojis anywhere, and include a blank line between each major section:

> PERFORMANCE ANALYSIS REPORT

KEY MOMENTS BREAKDOWN

> 0:06s - [Moment when first significant action occurs - NOT at 0:00]
> 0:14s - [Another key moment - timestamp based on actual event]
> 0:23s - [Key moment - irregular timing based on gameplay]
> 0:31s - [Important play or mistake]
> 0:47s - [Another significant event]
[Include 5-10 moments based on ACTUAL events - timestamps should be irregular, not evenly spaced]

AIM & ACCURACY PERFORMANCE

> Crosshair Placement: [DETAILED analysis with specific observations, reasoning for why placement was good/bad, examples from gameplay, and impact on performance. Explain what you observed and why it matters.]
> First-Shot Accuracy: [DETAILED analysis with specific observations, reasoning, examples, and impact. Be specific about what happened and why it was effective or problematic.]
> Tracking Stability: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain the quality of tracking and why it matters.]
> Recoil Control: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain how well recoil was managed and the consequences.]
> ADS Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain when ADS was used and whether timing was optimal.]
> Reaction Time: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain response speed to threats and opportunities.]
> Reticle Discipline: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain crosshair control and positioning.]
> Strafing Aim Quality: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain aim quality while moving.]
> Overflicking/Underflicking Patterns: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain flick accuracy and consistency.]

MOVEMENT & MECHANICS

> Strafing Technique: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain strafing effectiveness and why it was good or bad.]
> Slide Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain when slides were used and whether timing was optimal.]
> Jump-Shot Usage: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain jump shot effectiveness and frequency.]
> Rotation Efficiency: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain movement efficiency during rotations and why certain paths were chosen.]
> Peeking Technique: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain how corners were peeked and whether technique was safe/effective.]
> Sprint-to-fire: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain awareness of sprint-to-fire delay and positioning.]
> Movement Predictability: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain whether movement patterns were predictable and why this matters.]

POSITIONING & MAP CONTROL

> Angle Selection: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain why certain angles were chosen and whether they were optimal.]
> Cover Usage: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain how effectively cover was utilized and why it matters.]
> Map Awareness: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain understanding of map layout and enemy positions.]
> Distance Control: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain engagement distance management and why certain distances were chosen.]
> Elevation Advantages: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain use of vertical positioning and its effectiveness.]

GAME SENSE & DECISION-MAKING

> Predictability: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain whether playstyle was predictable and why this is problematic.]
> Angle Checking: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain thoroughness of angle checks and why missed checks were dangerous.]
> Push Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain timing of aggressive pushes and whether they were well-timed.]
> Sound Cues: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain use of audio information and reaction to sound cues.]
> Rotation Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain timing of map rotations and whether they were optimal.]
> Situational Awareness: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain overall awareness of game state and threats.]

ENGAGEMENT QUALITY

> Opening Shot Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain timing of first shots and whether advantage was gained.]
> Fight Initiations: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain how fights were started and whether initiation was smart.]
> Cover Mid-fight: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain use of cover during engagements and why it matters.]
> Re-challenges: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain decision to re-engage and whether it was smart.]
> Weapon Swap Speed: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain weapon switching efficiency and timing.]
> Reload Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain when reloads occurred and whether timing was safe.]

WEAPON & LOADOUT OPTIMIZATION

> Weapon Choice: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain weapon selection and whether it suited the situation.]
> Attachment Usage: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain attachment choices and their effectiveness.]
> FOV & Sensitivity: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain apparent settings and whether they seem optimal.]
> Recommendations: [DETAILED recommendations with reasoning for why changes would help.]

DEFENSE & SURVIVABILITY

> Survival Opportunities: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain missed opportunities to survive and why they were missed.]
> Open Exposure: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain time spent in open areas and why this was dangerous.]
> Blind Spots: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain awareness of blind spots and whether they were checked.]
> Disengagement Timing: [DETAILED analysis with specific observations, reasoning, examples, and impact. Explain when player should have disengaged and why.]

ADVANCED METRICS

> Lane Pressure Analysis: [DETAILED analysis with percentage estimate, reasoning for the percentage, specific examples, and impact on gameplay.]
> Time Exposed vs Cover: [DETAILED analysis with percentage estimate, reasoning, specific examples, and why this ratio matters.]
> Tempo Rating: [DETAILED analysis with rating (Aggressive/Passive/Balanced), reasoning for the rating, specific examples, and impact.]
> Predictability Score: [DETAILED analysis with score estimate, reasoning, specific examples of predictable patterns, and why this hurts performance.]
> Mechanical Consistency: [DETAILED analysis with score estimate, reasoning, specific examples of consistency/inconsistency, and impact.]
> Confidence Rating: [DETAILED analysis with score estimate, reasoning, specific examples of confident/hesitant play, and impact.]

PERSONALIZED COACHING FEEDBACK

> Weekly Improvement Plan: [Detailed plan]
> Top 5 Habits Hurting Performance: [List and analysis]
> Top 5 Easy Wins: [List and analysis]
> Playstyle Summary: [One sentence summary]
> Priority Focus: [Main focus area]

TRAINING DRILLS:

> [Drill Name] Drill: [Description]
> Step 1: [First step]
> Step 2: [Second step]
> Step 3: [Third step]
> Goal: [What to achieve]
> [Repeat for multiple drills]

Required JSON Structure (PROVIDE ALL SCORES - evaluate each independently):
{
  "scorecard": {
    // CORE METRICS (REQUIRED)
    "overallScore": number (one decimal place),
    "aimAccuracy": number,
    "movementMechanics": number,
    "positioning": number,
    "gameSense": number,
    "engagementQuality": number,
    "survivability": number,
    
    // AIM & ACCURACY METRICS
    "crosshairPlacement": number,
    "firstShotAccuracy": number,
    "trackingStability": number,
    "flickTiming": number,
    "recoilControl": number,
    "adsTiming": number,
    "reactionTime": number,
    "reticleDiscipline": number,
    "strafingAimQuality": number,
    "targetAcquisitionSpeed": number,     // NEW: How fast player acquires new targets
    "headLevelConsistency": number,       // NEW: How consistently crosshair stays at head level
    "preAimAccuracy": number,             // NEW: Quality of pre-aiming common angles
    "sprayTransferControl": number,       // NEW: Ability to transfer spray between targets
    
    // MOVEMENT & MECHANICS METRICS
    "strafingTechnique": number,
    "slideTiming": number,
    "jumpShotUsage": number,
    "rotationEfficiency": number,
    "peekingTechnique": number,
    "counterStrafing": number,            // NEW: Quality of counter-strafe before shooting
    "jigglePeeking": number,              // NEW: Effectiveness of jiggle peek information gathering
    "movementUnpredictability": number,   // NEW: How hard to track/predict movement
    "sprintManagement": number,           // NEW: Smart use of tactical vs regular sprint
    "bunnyHopEfficiency": number,         // NEW: Effectiveness of bunny hop chains
    
    // POSITIONING & MAP CONTROL METRICS
    "angleSelection": number,
    "coverUsage": number,
    "mapAwareness": number,
    "offAngleUsage": number,              // NEW: Creative use of unexpected angles
    "tradeability": number,               // NEW: How easy teammates can trade if player dies
    "utilityAvoidance": number,           // NEW: Skill at avoiding/dodging utility
    "sightlineManagement": number,        // NEW: Managing multiple sightlines safely
    "verticality": number,                // NEW: Use of vertical space/height advantages
    
    // GAME SENSE & DECISION METRICS
    "predictability": number,
    "awarenessChecks": number,
    "rotationTiming": number,
    "situationalAwareness": number,
    "informationUsage": number,           // NEW: How well player uses gathered info
    "economyAwareness": number,           // NEW: Awareness of enemy/team economy decisions
    "clutchPotential": number,            // NEW: Composure and decision-making under pressure
    "adaptability": number,               // NEW: Ability to adapt to unexpected situations
    
    // ENGAGEMENT & COMBAT METRICS
    "openingShotTiming": number,
    "fightInitiations": number,
    "weaponSwapSpeed": number,
    "reloadTiming": number,
    "peekCommitment": number,             // NEW: Decisiveness when peeking (not half-peeking)
    "isolationSkill": number,             // NEW: Ability to take 1v1 fights
    "tradePrevention": number,            // NEW: Avoiding being traded after a kill
    "multiKillPotential": number,         // NEW: Ability to chain kills efficiently
    
    // SURVIVABILITY & UTILITY METRICS
    "disengagementTiming": number,
    "lanePressure": number,
    "tempoRating": number,
    "mechanicalConsistency": number,
    "confidenceRating": number,
    "healthManagement": number,           // NEW: Smart decisions based on health state
    "escapeRouting": number,              // NEW: Quality of escape routes when retreating
    "damageTradingEfficiency": number,    // NEW: Getting more damage than taking
    "timeAliveEfficiency": number         // NEW: Impact during time alive
  },
  "markdownReport": "The full markdown report text following the exact format above..."
}

CRITICAL FORMATTING RULES:
- Use ">" (greater than symbol followed by space) for EVERY single bullet point. NO dashes, NO asterisks, NO other bullet symbols.
- Each line that is a bullet point MUST start with "> "
- Include MANY key moments (at least 5-10) covering different seconds throughout the clip
- NO emojis anywhere in the entire report
- Include a blank line between each major section header and its content
- Include a blank line after each major section before the next section header
- Maintain a serious, analytical tone throughout
- Ensure timing in key moments is accurate based on the frame sequence provided
- Make sure every analysis point uses "> " format, not regular bullets
`;
    
    content.push({ type: "text", text: promptText });
    
    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
    
    // Invoke cleanup function to delete video and frames
    if (CLEANUP_FUNCTION_NAME) {
      try {
        console.log('Invoking cleanup function...');
        await lambda.send(new InvokeCommand({
          FunctionName: CLEANUP_FUNCTION_NAME,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify({ userId, reportId }),
        }));
        console.log('Cleanup function invoked successfully');
      } catch (cleanupError: any) {
        console.error('Failed to invoke cleanup function:', cleanupError);
        // Don't fail the whole process if cleanup fails
      }
    } else {
      console.warn('CLEANUP_FUNCTION_NAME not set, skipping cleanup');
    }
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

