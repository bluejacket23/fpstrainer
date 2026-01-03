import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import OpenAI from 'openai';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.TABLE_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate 8-Week Training Program Lambda
 * Creates a detailed training program based on report analysis
 * Available for Elite plan and above
 */
export const handler = async (event: any) => {
  console.log('Generate training program event:', JSON.stringify(event, null, 2));
  
  const { userId, reportId } = event;
  
  if (!userId || !reportId) {
    return {
      success: false,
      error: 'Missing userId or reportId',
    };
  }
  
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }
  
  try {
    // Get report
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    
    if (!result.Item || !result.Item.aiReportMarkdown) {
      return {
        success: false,
        error: 'Report not found or incomplete',
      };
    }
    
    const reportMarkdown = result.Item.aiReportMarkdown;
    const scorecard = result.Item.aiReportJson || {};
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    
    const prompt = `You are an elite FPS training coach. Based on the following gameplay analysis report, create a detailed 8-week personalized training program.

REPORT ANALYSIS:
${reportMarkdown}

SCORECARD:
${JSON.stringify(scorecard, null, 2)}

Create a comprehensive 8-week training program that includes:

1. **Week-by-Week Breakdown**: Each week should have specific focus areas
2. **Daily Training Schedule**: What to practice each day
3. **Specific Drills**: Step-by-step instructions for each drill
4. **Setup Instructions**: How to configure training modes, maps, settings
5. **Progression Tracking**: How to measure improvement each week
6. **Rest Days**: When to take breaks
7. **Warm-up Routines**: Pre-training warm-up exercises
8. **Goal Setting**: Specific targets for each week

Format the response as detailed markdown with clear sections. Be specific, actionable, and tailored to the weaknesses identified in the report.

Output the training program as a JSON object with this structure:
{
  "title": "8-Week Training Program",
  "overview": "Brief overview of the program",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Main focus area for this week",
      "goals": ["Goal 1", "Goal 2"],
      "schedule": {
        "monday": { "focus": "...", "drills": ["..."], "duration": "..." },
        "tuesday": { ... },
        // ... for each day
      },
      "setup": "How to configure for this week's training",
      "tracking": "How to measure progress"
    }
    // ... for 8 weeks
  ],
  "warmupRoutine": "Daily warm-up instructions",
  "restDays": "When and why to rest",
  "finalAssessment": "How to evaluate progress after 8 weeks"
}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });
    
    const programJson = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      success: true,
      program: programJson,
    };
  } catch (error: any) {
    console.error('Error generating training program:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

