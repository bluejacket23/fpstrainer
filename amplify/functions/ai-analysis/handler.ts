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
You analyze gameplay with the expectation of PROFESSIONAL-LEVEL performance. Be CRITICAL, DETAILED, and CONSTRUCTIVE. You're coaching players who want to compete at the highest level. Point out mistakes, missed opportunities, and areas for improvement with SPECIFIC REASONING and EXPLANATIONS. Also acknowledge strong plays and good decision-making, but be honest about what needs work. Provide DETAILED EXPLANATIONS for WHY something is good or bad, not just what happened. Scores should reflect a balanced but STRICT assessment - recognize excellent play when you see it, but don't inflate scores for average performance. Be slightly more critical than overly generous - players need honest feedback to improve.

**SCORING STANDARDS:**
- Score like a STRICT professional coach evaluating gameplay with high standards
- 90-100: Exceptional, near-perfect execution - professional tournament level (rare, reserved for truly exceptional play)
- 85-89: Excellent play with minor flaws - strong competitive level (very good players)
- 75-84: Good play with some mistakes - solid fundamentals, room to refine (above average)
- 65-74: Average to decent play - functional but needs improvement in key areas (typical player)
- 55-64: Below average - multiple areas need significant work (needs improvement)
- Below 55: Poor performance - fundamental issues across the board (beginner level)
- Be HONEST and STRICT. Acknowledge strong plays and good decisions, but be critical of mistakes and areas for improvement. Don't inflate scores - be slightly harsher than generous.
- Professional/excellent players typically score 85-95. Good competitive players score 75-84. Average players score 65-74. Most players will score in the 60-75 range unless they're genuinely skilled.
- ALL scores MUST be decimals with ONE decimal place (72.3, 68.7, NOT 72.0, 68.0)
- **CRITICAL: Individual scores MUST vary significantly from the overall score.** If overallScore is 80.0, individual scores should range from approximately 70-90, with some higher and some lower. Do NOT make all scores cluster around the overall score. Each category should reflect its own performance level independently.
- **IMPORTANT: Be slightly more critical with scoring. If you're unsure between two score ranges, choose the lower one. Players need honest feedback to improve.**

Analyze the following sequence of frames from a player's clip (max 60s). 
Provide a deeply detailed, pro-level coaching breakdown in the EXACT order specified below:

**1. KEY MOMENTS BREAKDOWN** (MUST BE FIRST)
Provide specific timestamps in EXACT format. Each moment must be on its own line starting with "> " followed by the timestamp, then " - ", then a DETAILED description with REASONING. You MUST provide multiple moments (at least 8-12) covering different seconds throughout the clip. For each moment, explain:
- WHAT happened
- WHY it was good or bad
- WHAT the player should have done differently (if it was a mistake)
- The CONSEQUENCE or IMPACT of the decision

Format examples:
> 0:13s - Player engaged with enemy but had poor crosshair placement. Crosshair was positioned at chest level instead of head height, resulting in missed initial shots. This forced the player to readjust mid-fight, losing the advantage. Should have pre-aimed at head height before peeking the corner, as this is a common engagement point. The missed shots allowed the enemy to return fire and deal significant damage.

> 0:19-0:21s - Player was caught in the open without cover for approximately 2 seconds, leading to taking heavy damage. The player sprinted across an open lane without checking for enemies or having an escape route. This positioning error exposed them to multiple angles simultaneously. Should have used the nearby cover to move more safely, or at minimum, checked the common enemy positions before committing to the rotation. This mistake nearly resulted in elimination.

Each moment should be DETAILED with specific reasoning and explanations. Include many moments throughout the 60-second clip.

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

IMPORTANT: Provide scores for as many categories as you can reasonably evaluate from the frames. If you cannot evaluate a specific metric, you may omit it, but always include: overallScore, aimAccuracy, movementMechanics, positioning, gameSense, engagementQuality, and survivability as minimum required scores.

The markdownReport MUST follow this EXACT format and order. Use ">" for ALL bullet points (NO dashes, NO asterisks, ONLY ">"), NO emojis anywhere, and include a blank line between each major section:

> PERFORMANCE ANALYSIS REPORT

KEY MOMENTS BREAKDOWN

> 0:13s - [First detailed moment description]
> 0:19-0:21s - [Second detailed moment description]
> 0:31s - [Third detailed moment description]
> 0:41s - [Fourth detailed moment description]
> 0:45s - [Fifth detailed moment description]
[Continue with many more moments throughout the clip - at least 5-10 moments covering different seconds]

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

