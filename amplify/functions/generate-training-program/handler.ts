import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import OpenAI from 'openai';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.TABLE_NAME;
const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Elite and above plans that can access this feature
const ELIGIBLE_PLANS = ['ELITE', 'PRO', 'GOD'];

/**
 * Generate Personalized 8-Week Training Program Lambda
 * 
 * Uses gpt-4o-mini for cost efficiency (no vision needed, just text analysis)
 * - gpt-4o-mini: ~$0.15/1M input, ~$0.60/1M output tokens
 * - Estimated cost per program: ~$0.002-0.005 (very cheap!)
 * 
 * Available for Elite plan and above only
 */
export const handler = async (event: any) => {
  console.log('Generate training program event:', JSON.stringify(event, null, 2));
  
  // Get userId from Cognito identity (AppSync resolver)
  const userId = event.identity?.sub;
  const reportId = event.arguments?.reportId;
  
  console.log('User ID:', userId, 'Report ID:', reportId);
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated',
    };
  }
  
  if (!reportId) {
    return {
      success: false,
      error: 'Missing reportId',
    };
  }
  
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured');
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }
  
  try {
    // Check user's subscription plan
    if (USER_TABLE_NAME) {
      console.log('Checking user plan in table:', USER_TABLE_NAME);
      const userResult = await docClient.send(new GetCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId },
      }));
      
      console.log('User data:', userResult.Item);
      const userPlan = userResult.Item?.subscriptionPlan || 'RECRUIT';
      
      if (!ELIGIBLE_PLANS.includes(userPlan)) {
        return {
          success: false,
          error: 'This feature requires Elite plan or higher. Please upgrade to access personalized training programs.',
          requiresUpgrade: true,
          currentPlan: userPlan,
        };
      }
    } else {
      console.warn('USER_TABLE_NAME not configured, skipping plan check');
    }
    
    // Get report
    console.log('Fetching report from table:', TABLE_NAME);
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    
    if (!result.Item || !result.Item.aiReportMarkdown) {
      console.error('Report not found:', { userId, reportId, item: result.Item });
      return {
        success: false,
        error: 'Report not found or incomplete',
      };
    }
    
    const reportMarkdown = result.Item.aiReportMarkdown;
    const scorecard = result.Item.aiReportJson || {};
    
    console.log('Report found, generating training program...');
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    
    // Using gpt-4o-mini for cost efficiency
    // This is a text-only task (no vision needed) so mini is perfect
    const prompt = `You are an elite FPS esports coach creating a personalized training program.

Based on this gameplay analysis report, create a detailed 8-week training program tailored to this player's specific weaknesses and strengths.

=== PLAYER ANALYSIS REPORT ===
${reportMarkdown}

=== SCORECARD DATA ===
${JSON.stringify(scorecard, null, 2)}

=== YOUR TASK ===
Create a comprehensive, personalized 8-week training program that:

1. Prioritizes the player's WEAKEST areas first (lowest scores)
2. Maintains and builds on their STRENGTHS
3. Provides specific, actionable drills they can do in-game
4. Includes progressive difficulty (each week builds on the last)
5. Has clear daily schedules with time estimates
6. Includes rest days to prevent burnout

Output as a JSON object with this exact structure:
{
  "title": "Your Personalized 8-Week Training Program",
  "playerProfile": {
    "primaryWeaknesses": ["weakness1", "weakness2", "weakness3"],
    "strengths": ["strength1", "strength2"],
    "focusAreas": ["area1", "area2", "area3"]
  },
  "overview": "2-3 sentence overview of what this program will achieve",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme/focus",
      "focus": "Primary focus area",
      "goals": ["Specific goal 1", "Specific goal 2", "Specific goal 3"],
      "days": {
        "monday": {
          "type": "training",
          "focus": "Specific focus",
          "warmup": "5-10 min warmup routine",
          "drills": [
            {
              "name": "Drill name",
              "duration": "15 min",
              "instructions": "Step by step instructions",
              "targetMetric": "What to measure"
            }
          ],
          "cooldown": "What to do after",
          "totalTime": "45 min"
        },
        "tuesday": { ... },
        "wednesday": { ... },
        "thursday": { ... },
        "friday": { ... },
        "saturday": { "type": "light" or "rest", ... },
        "sunday": { "type": "rest", "activities": "Optional VOD review" }
      },
      "weeklyGoal": "What success looks like this week",
      "progressCheck": "How to measure improvement"
    }
    // ... weeks 2-8, with progressive difficulty
  ],
  "warmupRoutine": {
    "duration": "10 min",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "mentalTips": ["Tip 1", "Tip 2", "Tip 3"],
  "equipmentSetup": {
    "sensitivity": "Recommended sens adjustments if needed",
    "crosshair": "Crosshair recommendations",
    "otherSettings": "Any other recommended settings"
  },
  "finalAssessment": "How to evaluate overall progress after 8 weeks"
}

Make it SPECIFIC to this player's analysis. Reference their actual scores and identified issues.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for text processing (~90% cheaper than gpt-4o)
      messages: [
        {
          role: 'system',
          content: 'You are an elite FPS esports coach with years of experience training professional players. You create detailed, personalized training programs that produce real results. Always output valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 8000, // Allow for comprehensive program
      temperature: 0.7, // Some creativity but consistent
      response_format: { type: 'json_object' },
    });
    
    const programJson = JSON.parse(response.choices[0].message.content || '{}');
    
    // Log token usage for cost tracking
    const usage = response.usage;
    console.log('Token usage:', {
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      // gpt-4o-mini costs: $0.15/1M input, $0.60/1M output
      estimatedCost: usage ? 
        ((usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006)).toFixed(6) : 
        'unknown',
    });
    
    return {
      success: true,
      program: programJson,
    };
  } catch (error: any) {
    console.error('Error generating training program:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate training program',
    };
  }
};
