import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = process.env.TABLE_NAME;
const USER_TABLE_NAME = process.env.USER_TABLE_NAME;

const ELIGIBLE_PLANS = ['ELITE', 'PRO', 'GOD'];

// Pre-built training program template - customized based on player weaknesses
function generateProgram(weakAreas: string[], strongAreas: string[]) {
  const focusAreaDrills: Record<string, string[]> = {
    aim: ['Aim Lab Gridshot', 'Bot Practice Headshots Only', 'Tracking Drills', 'Flick Practice'],
    crosshair: ['Crosshair Placement Workshop', 'Pre-aim Common Angles', 'Head Height Practice'],
    movement: ['Counter-strafe Practice', 'Jiggle Peek Drills', 'Slide Cancel Timing', 'Bunny Hop Course'],
    positioning: ['Map Knowledge Review', 'Off-angle Practice', 'Cover Usage Drills', 'Rotation Timing'],
    gamesense: ['VOD Review Session', 'Callout Practice', 'Prediction Exercises', 'Economy Management'],
    recoil: ['Spray Control Practice', 'Recoil Pattern Memorization', 'Burst Fire Drills'],
    reaction: ['Reaction Time Trainer', 'Audio Cue Response', 'Quick Scope Drills'],
    default: ['Deathmatch Warmup', 'Custom Game Practice', 'Ranked Play Focus']
  };

  const getAreaType = (area: string): string => {
    const lower = area.toLowerCase();
    if (lower.includes('aim') || lower.includes('accuracy') || lower.includes('flick')) return 'aim';
    if (lower.includes('crosshair') || lower.includes('placement')) return 'crosshair';
    if (lower.includes('movement') || lower.includes('strafe') || lower.includes('peek')) return 'movement';
    if (lower.includes('position') || lower.includes('cover') || lower.includes('angle')) return 'positioning';
    if (lower.includes('sense') || lower.includes('decision') || lower.includes('awareness')) return 'gamesense';
    if (lower.includes('recoil') || lower.includes('spray') || lower.includes('control')) return 'recoil';
    if (lower.includes('reaction') || lower.includes('reflex')) return 'reaction';
    return 'default';
  };

  const weeks = [];
  const weekFocuses = [
    'Foundation & Assessment',
    'Core Mechanics',
    'Advanced Techniques',
    'Consistency Building',
    'Speed & Efficiency',
    'Pressure Situations',
    'Integration Week',
    'Peak Performance'
  ];

  for (let i = 1; i <= 8; i++) {
    const primaryFocus = weakAreas[(i - 1) % weakAreas.length] || 'General Skills';
    const secondaryFocus = weakAreas[i % weakAreas.length] || 'Mechanics';
    const areaType = getAreaType(primaryFocus);
    const drills = focusAreaDrills[areaType] || focusAreaDrills.default;

    weeks.push({
      weekNumber: i,
      focus: weekFocuses[i - 1],
      overview: `Week ${i} focuses on improving ${primaryFocus} with secondary work on ${secondaryFocus}`,
      goals: [
        `Improve ${primaryFocus} by 10%`,
        `Develop consistent ${secondaryFocus} habits`,
        `Build muscle memory for key mechanics`
      ],
      schedule: {
        monday: { focus: primaryFocus, duration: '30min', drills: [drills[0], drills[1]] },
        tuesday: { focus: secondaryFocus, duration: '30min', drills: [drills[1], drills[2] || drills[0]] },
        wednesday: { focus: primaryFocus, duration: '30min', drills: [drills[2] || drills[0], drills[3] || drills[1]] },
        thursday: { focus: 'Mixed Practice', duration: '30min', drills: [drills[0], drills[3] || drills[1]] },
        friday: { focus: primaryFocus, duration: '30min', drills: drills.slice(0, 2) },
        saturday: { focus: 'Light Practice', duration: '20min', drills: ['Deathmatch Warmup'] },
        sunday: { focus: 'Rest', duration: '0', drills: [] }
      },
      setup: `Focus on ${primaryFocus} maps and modes. Use practice range before ranked.`,
      tracking: `Track your ${primaryFocus} stats. Record 1 match for VOD review.`
    });
  }

  return {
    title: 'Your Personalized 8-Week Training Program',
    overview: `This program targets your weak areas: ${weakAreas.slice(0, 3).join(', ')}. Each week progressively builds on the last, turning weaknesses into strengths.`,
    playerProfile: {
      weaknesses: weakAreas.slice(0, 3),
      strengths: strongAreas.slice(0, 2),
      priorityFocus: weakAreas.slice(0, 2)
    },
    weeks,
    warmupRoutine: '5 min aim trainer → 5 min deathmatch → 5 min custom game movement',
    restDays: 'Sunday is full rest. Saturday is optional light practice. Listen to your body.',
    finalAssessment: 'Record a ranked match in week 1 and week 8. Compare your stats and watch both VODs to see improvement.'
  };
}

export const handler = async (event: any) => {
  console.log('Generate training program event:', JSON.stringify(event, null, 2));
  
  const userId = event.identity?.sub;
  const reportId = event.arguments?.reportId;
  
  console.log('User ID:', userId, 'Report ID:', reportId);
  
  if (!userId || !reportId) {
    return { success: false, error: 'Missing userId or reportId' };
  }
  
  try {
    // Check user plan
    if (USER_TABLE_NAME) {
      const userResult = await docClient.send(new GetCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId },
      }));
      
      const userPlan = userResult.Item?.subscriptionPlan || 'RECRUIT';
      if (!ELIGIBLE_PLANS.includes(userPlan)) {
        return {
          success: false,
          error: 'This feature requires Elite plan or higher.',
          requiresUpgrade: true,
        };
      }
    }
    
    // Get report scorecard
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, reportId },
    }));
    
    if (!result.Item) {
      return { success: false, error: 'Report not found' };
    }
    
    const scorecard = result.Item.aiReportJson || {};
    
    // Extract weak and strong areas from scorecard
    const scores = Object.entries(scorecard)
      .filter(([key, val]) => typeof val === 'number' && key !== 'overallScore')
      .map(([key, val]) => ({ area: key.replace(/([A-Z])/g, ' $1').trim(), score: val as number }))
      .sort((a, b) => a.score - b.score);
    
    const weakAreas = scores.slice(0, 4).map(s => s.area);
    const strongAreas = scores.slice(-3).map(s => s.area);
    
    console.log('Weak areas:', weakAreas);
    console.log('Strong areas:', strongAreas);
    
    // Generate program instantly (no API call)
    const program = generateProgram(weakAreas, strongAreas);
    
    return {
      success: true,
      program,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};
