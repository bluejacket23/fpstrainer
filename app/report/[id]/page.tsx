"use client";

import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle, Target, Activity, Map, Brain, Swords, Shield, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const client = generateClient<Schema>();

const PROCESSING_MESSAGES = [
  "> ANALYZING GAMEPLAY...",
  "> EXTRACTING FRAMES FROM VIDEO...",
  "> PROCESSING VISUAL DATA...",
  "> CALCULATING AIM ACCURACY METRICS...",
  "> EVALUATING MOVEMENT PATTERNS...",
  "> ASSESSING POSITIONING STRATEGY...",
  "> ANALYZING ENGAGEMENT QUALITY...",
  "> SCANNING FOR IMPROVEMENT OPPORTUNITIES...",
  "> PROCESSING ADVANCED METRICS...",
  "> GENERATING COACHING INSIGHTS...",
  "> COMPILING PERFORMANCE SCORECARD...",
  "> IDENTIFYING KEY MOMENTS...",
  "> EVALUATING GAME SENSE...",
  "> ANALYZING WEAPON HANDLING...",
  "> ASSESSING SURVIVABILITY FACTORS...",
  "> PROCESSING TACTICAL DECISIONS...",
  "> CALCULATING PREDICTABILITY SCORE...",
  "> EVALUATING MECHANICAL CONSISTENCY...",
  "> GENERATING PERSONALIZED FEEDBACK...",
  "> FINALIZING ANALYSIS REPORT...",
];

export default function ReportPage() {
  return (
    <Authenticator>
      {({ user }) => <ReportContent user={user} />}
    </Authenticator>
  );
}

function ReportContent({ user }: { user: any }) {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!id || !user) return;
    
    const userId = user.userId || user.sub;
    if (!userId) {
      console.error('No userId found in user object', user);
      setLoading(false);
      return;
    }
    
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let isFetching = false;
    let shouldPoll = true; // Track if we should continue polling
    
    const fetchReport = async () => {
      // Prevent multiple simultaneous queries
      if (isFetching) {
        return;
      }
      
      isFetching = true;
      
      try {
        let reportData = null;
        
        // Try list query first (more reliable with owner() auth)
        try {
          const { data: reports, errors } = await client.models.OpsCoachReport.list();
          
          if (errors && errors.length > 0) {
            console.warn('List query errors (non-critical):', errors);
          }
          
          // Filter client-side by reportId
          if (reports && reports.length > 0) {
            const found = reports.find((r: any) => r && r.reportId === id);
            if (found) {
              reportData = found;
              console.log('Report found via list query');
            }
          }
        } catch (listError) {
          console.warn('List query failed, trying getReportCustom:', listError);
        }
        
        // Fallback to getReportCustom if list didn't work
        if (!reportData) {
          try {
            const result = await client.queries.getReportCustom({
              userId,
              reportId: id as string,
            });
            
            if (result.errors && result.errors.length > 0) {
              console.warn('getReportCustom errors (non-critical):', result.errors);
            } else if (result.data) {
              reportData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
              console.log('Report found via getReportCustom');
            }
          } catch (customError) {
            console.warn('getReportCustom also failed:', customError);
          }
        }
        
        if (reportData && isMounted) {
          // Parse aiReportJson if it's a string
          if (reportData.aiReportJson && typeof reportData.aiReportJson === 'string') {
            try {
              reportData.aiReportJson = JSON.parse(reportData.aiReportJson);
            } catch (e) {
              console.error('Failed to parse aiReportJson:', e);
            }
          }
          
          console.log('Report found:', {
            reportId: reportData.reportId,
            status: reportData.processingStatus,
            timestamp: reportData.timestamp,
          });
          
          setReport(reportData);
          setLoading(false);
          
          // Stop polling if completed or failed
          if (reportData.processingStatus === 'COMPLETED' || reportData.processingStatus === 'FAILED') {
            console.log('Report processing finished:', reportData.processingStatus);
            shouldPoll = false; // Stop polling
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            isFetching = false;
            return;
          }
        } else if (isMounted) {
          // Report not found yet - keep loading state but log it
          console.log('Report not found yet, continuing to poll...', {
            reportId: id,
            userId: userId,
          });
          
          // After 30 seconds, if still no report, show error
          // This handles cases where the report was never created
          setTimeout(() => {
            if (isMounted && !report) {
              console.error('Report not found after 30 seconds - may not have been created');
              setLoading(false);
              // Set a dummy report with FAILED status so UI shows something
              setReport({
                reportId: id,
                processingStatus: 'FAILED',
                error: 'Report not found. The upload may have failed.',
              });
              shouldPoll = false;
            }
          }, 30000);
        }
      } catch (e) {
        console.error('Error fetching report:', e);
      } finally {
        isFetching = false;
      }
    };

    // Initial fetch
    fetchReport();
    
    // Start polling only if report is not completed/failed
    // Poll every 10 seconds (less frequent) only for in-progress reports
    pollInterval = setInterval(() => {
      if (isMounted && shouldPoll && !isFetching) {
        fetchReport();
      }
    }, 10000);
    
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [id, user]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(messageInterval);
  }, []);

  // Only show loading state if we don't have a report yet
  // If we have a report but it's loading, check the status
  if (loading && !report) {
    return (
      <div className="max-w-7xl mx-auto p-4 py-12">
        <div className="text-center py-20">
          <div className="relative">
            <Loader2 size={64} className="mx-auto mb-6 text-neon animate-spin drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-neon/30 rounded-full animate-ping" />
            </div>
          </div>
          
          <div className="bg-surface/50 border border-neon/20 rounded-lg p-6 mb-4 backdrop-blur-sm">
            <p 
              key={currentMessageIndex}
              className="text-neon font-mono text-lg tracking-wider animate-pulse"
              style={{
                textShadow: '0 0 10px rgba(0,255,157,0.5)',
              }}
            >
              {PROCESSING_MESSAGES[currentMessageIndex]}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-400 font-mono text-sm">
              &gt; ESTIMATED TIME: 1-2 MINUTES
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
              <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
              <span>LOADING...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If we have a report but it's still loading (initial fetch), show a simple loading state
  if (loading && report) {
    return (
      <div className="max-w-7xl mx-auto p-4 py-12">
        <div className="text-center py-20">
          <Loader2 size={48} className="mx-auto mb-4 text-neon animate-spin" />
          <p className="text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }
  
  // If no report found after loading
  if (!report) {
    return (
      <div className="max-w-7xl mx-auto p-4 py-12">
        <div className="text-center text-danger">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Report Not Found</h2>
          <p className="text-gray-400">The report you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (report.processingStatus === 'FAILED') {
    return (
      <div className="max-w-7xl mx-auto p-4 py-12">
        <div className="text-center text-danger">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Analysis Failed</h2>
          <p className="text-gray-400">Something went wrong. Please try again.</p>
        </div>
      </div>
    );
  }

  // Show processing state only for actively processing reports
  // Don't show processing UI for completed reports - they should display immediately
  if (report.processingStatus && report.processingStatus !== 'COMPLETED' && report.processingStatus !== 'FAILED') {
    const statusMessage = 
      report.processingStatus === 'UPLOADING' ? 'Uploading video...' :
      report.processingStatus === 'PROCESSING' ? 'Extracting frames...' :
      report.processingStatus === 'ANALYZING' ? 'AI analyzing gameplay...' :
      'Processing...';
    return (
      <div className="max-w-7xl mx-auto p-4 py-12">
        <div className="text-center py-20">
          <div className="relative">
            <Loader2 size={64} className="mx-auto mb-6 text-neon animate-spin drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-neon/30 rounded-full animate-ping" />
            </div>
          </div>
          
          <div className="bg-surface/50 border border-neon/20 rounded-lg p-6 mb-4 backdrop-blur-sm">
            <p 
              key={currentMessageIndex}
              className="text-neon font-mono text-lg tracking-wider animate-pulse"
              style={{
                textShadow: '0 0 10px rgba(0,255,157,0.5)',
              }}
            >
              {PROCESSING_MESSAGES[currentMessageIndex]}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-400 font-mono text-sm">
              &gt; STATUS: {statusMessage}
            </p>
            <p className="text-gray-400 font-mono text-sm">
              &gt; ESTIMATED TIME: 1-2 MINUTES
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
              <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
              <span>{report.processingStatus || 'PROCESSING'}...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scorecard = report.aiReportJson || {};
  const hasScorecard = scorecard && Object.keys(scorecard).length > 0;

  return (
    <div className="max-w-7xl mx-auto p-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Report Content - Left Side (2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface p-8 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Coaching Report</h1>
              <button
                onClick={() => {
                  // TODO: Check user plan and implement 8-week program
                  alert('8-Week Training Program feature coming soon! Available for Elite plan and above.');
                }}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-400 rounded font-bold hover:bg-purple-500/30 transition-colors text-sm"
              >
                8-Week Program
              </button>
            </div>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {renderMarkdown(report.aiReportMarkdown || 'No report content available.')}
            </div>
          </div>
        </div>

        {/* Scorecard Sidebar - Right Side (1 column) */}
        {hasScorecard && (
          <div className="lg:col-span-1">
            <div className="bg-surface p-6 rounded-2xl border border-white/10 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Performance Scorecard</h2>
                <button
                  onClick={async () => {
                    try {
                      const scorecard = report.aiReportJson || {};
                      if (!scorecard || Object.keys(scorecard).length === 0) {
                        alert('No scorecard data available to generate graphic.');
                        return;
                      }
                      await generateShareableGraphic(scorecard);
                    } catch (error: any) {
                      console.error('Error generating graphic:', error);
                      alert('Failed to generate graphic: ' + error.message);
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-neon"
                  title="Share Scorecard"
                >
                  <Share2 size={20} />
                </button>
              </div>
              
              <div className="space-y-3 grid grid-cols-2 gap-3">
                {/* Overall Score */}
                {scorecard.overallScore !== undefined && (
                  <ScoreItem
                    label="Overall Score"
                    value={scorecard.overallScore}
                    icon={<Target />}
                    showTier
                  />
                )}

                {/* Aim & Accuracy Metrics */}
                {scorecard.aimAccuracy !== undefined && (
                  <ScoreItem label="Aim & Accuracy" value={scorecard.aimAccuracy} icon={<Target />} />
                )}
                {scorecard.crosshairPlacement !== undefined && (
                  <ScoreItem label="Crosshair Placement" value={scorecard.crosshairPlacement} icon={<Target />} />
                )}
                {scorecard.firstShotAccuracy !== undefined && (
                  <ScoreItem label="First Shot Accuracy" value={scorecard.firstShotAccuracy} icon={<Target />} />
                )}
                {scorecard.trackingStability !== undefined && (
                  <ScoreItem label="Tracking Stability" value={scorecard.trackingStability} icon={<Target />} />
                )}
                {scorecard.flickTiming !== undefined && (
                  <ScoreItem label="Flick Timing" value={scorecard.flickTiming} icon={<Target />} />
                )}
                {scorecard.recoilControl !== undefined && (
                  <ScoreItem label="Recoil Control" value={scorecard.recoilControl} icon={<Target />} />
                )}
                {scorecard.adsTiming !== undefined && (
                  <ScoreItem label="ADS Timing" value={scorecard.adsTiming} icon={<Target />} />
                )}
                {scorecard.reactionTime !== undefined && (
                  <ScoreItem label="Reaction Time" value={scorecard.reactionTime} icon={<Target />} />
                )}
                {scorecard.reticleDiscipline !== undefined && (
                  <ScoreItem label="Reticle Discipline" value={scorecard.reticleDiscipline} icon={<Target />} />
                )}
                {scorecard.strafingAimQuality !== undefined && (
                  <ScoreItem label="Strafing Aim Quality" value={scorecard.strafingAimQuality} icon={<Target />} />
                )}

                {/* Movement & Mechanics */}
                {scorecard.movementMechanics !== undefined && (
                  <ScoreItem label="Movement & Mechanics" value={scorecard.movementMechanics} icon={<Activity />} />
                )}
                {scorecard.strafingTechnique !== undefined && (
                  <ScoreItem label="Strafing Technique" value={scorecard.strafingTechnique} icon={<Activity />} />
                )}
                {scorecard.slideTiming !== undefined && (
                  <ScoreItem label="Slide Timing" value={scorecard.slideTiming} icon={<Activity />} />
                )}
                {scorecard.jumpShotUsage !== undefined && (
                  <ScoreItem label="Jump Shot Usage" value={scorecard.jumpShotUsage} icon={<Activity />} />
                )}
                {scorecard.rotationEfficiency !== undefined && (
                  <ScoreItem label="Rotation Efficiency" value={scorecard.rotationEfficiency} icon={<Activity />} />
                )}
                {scorecard.peekingTechnique !== undefined && (
                  <ScoreItem label="Peeking Technique" value={scorecard.peekingTechnique} icon={<Activity />} />
                )}

                {/* Positioning */}
                {scorecard.positioning !== undefined && (
                  <ScoreItem label="Positioning" value={scorecard.positioning} icon={<Map />} />
                )}
                {scorecard.angleSelection !== undefined && (
                  <ScoreItem label="Angle Selection" value={scorecard.angleSelection} icon={<Map />} />
                )}
                {scorecard.coverUsage !== undefined && (
                  <ScoreItem label="Cover Usage" value={scorecard.coverUsage} icon={<Map />} />
                )}
                {scorecard.mapAwareness !== undefined && (
                  <ScoreItem label="Map Awareness" value={scorecard.mapAwareness} icon={<Map />} />
                )}

                {/* Game Sense */}
                {scorecard.gameSense !== undefined && (
                  <ScoreItem label="Game Sense" value={scorecard.gameSense} icon={<Brain />} />
                )}
                {scorecard.predictability !== undefined && (
                  <ScoreItem label="Predictability" value={scorecard.predictability} icon={<Brain />} />
                )}
                {scorecard.awarenessChecks !== undefined && (
                  <ScoreItem label="Awareness Checks" value={scorecard.awarenessChecks} icon={<Brain />} />
                )}
                {scorecard.rotationTiming !== undefined && (
                  <ScoreItem label="Rotation Timing" value={scorecard.rotationTiming} icon={<Brain />} />
                )}
                {scorecard.situationalAwareness !== undefined && (
                  <ScoreItem label="Situational Awareness" value={scorecard.situationalAwareness} icon={<Brain />} />
                )}

                {/* Engagement Quality */}
                {scorecard.engagementQuality !== undefined && (
                  <ScoreItem label="Engagement Quality" value={scorecard.engagementQuality} icon={<Swords />} />
                )}
                {scorecard.openingShotTiming !== undefined && (
                  <ScoreItem label="Opening Shot Timing" value={scorecard.openingShotTiming} icon={<Swords />} />
                )}
                {scorecard.fightInitiations !== undefined && (
                  <ScoreItem label="Fight Initiations" value={scorecard.fightInitiations} icon={<Swords />} />
                )}
                {scorecard.weaponSwapSpeed !== undefined && (
                  <ScoreItem label="Weapon Swap Speed" value={scorecard.weaponSwapSpeed} icon={<Swords />} />
                )}
                {scorecard.reloadTiming !== undefined && (
                  <ScoreItem label="Reload Timing" value={scorecard.reloadTiming} icon={<Swords />} />
                )}

                {/* Survivability */}
                {scorecard.survivability !== undefined && (
                  <ScoreItem label="Survivability" value={scorecard.survivability} icon={<Shield />} />
                )}
                {scorecard.disengagementTiming !== undefined && (
                  <ScoreItem label="Disengagement Timing" value={scorecard.disengagementTiming} icon={<Shield />} />
                )}

                {/* Advanced Metrics */}
                {scorecard.lanePressure !== undefined && (
                  <ScoreItem label="Lane Pressure" value={scorecard.lanePressure} icon={<Brain />} />
                )}
                {scorecard.tempoRating !== undefined && (
                  <ScoreItem label="Tempo Rating" value={scorecard.tempoRating} icon={<Activity />} />
                )}
                {scorecard.mechanicalConsistency !== undefined && (
                  <ScoreItem label="Mechanical Consistency" value={scorecard.mechanicalConsistency} icon={<Target />} />
                )}
                {scorecard.confidenceRating !== undefined && (
                  <ScoreItem label="Confidence Rating" value={scorecard.confidenceRating} icon={<Brain />} />
                )}
              </div>
        </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ScoreItem({ label, value, icon, showTier }: any) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const tier = getTier(value);
  const color = getScoreColor(value);
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(numericValue, increment * step);
      setAnimatedValue(current);
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(numericValue);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-neon">{icon}</div>
          <span className="text-sm font-mono text-gray-400">{label}</span>
        </div>
        {showTier && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              tier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              tier.color === 'green' ? 'bg-green-500/20 text-green-400' :
              tier.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
              tier.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
              tier.color === 'red' ? 'bg-red-500/20 text-red-400' :
              tier.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
              tier.color === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}
          >
            {tier.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2 flex-1">
          <span className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
        <div className="relative">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - animatedValue / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{ opacity: 0.7 }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function getTier(score: number): { name: string; color: string } {
  if (score >= 98) return { name: 'God', color: 'black' };
  if (score >= 95) return { name: 'Legendary', color: 'gold' };
  if (score >= 90) return { name: 'Master', color: 'purple' };
  if (score >= 80) return { name: 'Elite', color: 'red' };
  if (score >= 70) return { name: 'Advanced', color: 'orange' };
  if (score >= 60) return { name: 'Competent', color: 'yellow' };
  if (score >= 50) return { name: 'Skilled', color: 'green' };
  return { name: 'Rookie', color: 'blue' };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#a855f7'; // Purple
  if (score >= 80) return '#ef4444'; // Red
  if (score >= 70) return '#f97316'; // Orange
  if (score >= 60) return '#eab308'; // Yellow
  if (score >= 50) return '#22c55e'; // Green
  return '#3b82f6'; // Blue
}

function renderMarkdown(markdown: string): JSX.Element {
  // Pre-process markdown to handle ">" bullets properly
  const lines = markdown.split('\n');
  const processedLines: JSX.Element[] = [];
  
  lines.forEach((line: string, index: number) => {
    const trimmed = line.trim();
    
    // Empty line - add spacing
    if (!trimmed) {
      processedLines.push(<div key={index} className="h-4" />);
      return;
    }
    
    // Headers
    if (trimmed.match(/^#{1,2}\s/)) {
      const level = trimmed.match(/^#+/)?.[0]?.length || 2;
      const text = trimmed.replace(/^#+\s/, '').trim();
      if (level === 1) {
        processedLines.push(<h1 key={index} className="text-3xl font-bold text-white mt-8 mb-4 uppercase tracking-wide">{text}</h1>);
      } else {
        processedLines.push(<h2 key={index} className="text-2xl font-bold text-white mt-8 mb-4 uppercase tracking-wide">{text}</h2>);
      }
      return;
    }
    
    // Lines starting with ">" - render as styled bullets
    if (trimmed.startsWith('> ')) {
      const content = trimmed.substring(2);
      processedLines.push(
        <div key={index} className="mb-2 text-gray-300 font-mono text-sm pl-4 border-l-2 border-neon/30 py-1">
          <span className="text-neon">&gt;</span> {content}
        </div>
      );
      return;
    }
    
    // Regular text
    processedLines.push(
      <p key={index} className="mb-3 text-gray-200 leading-relaxed">{line}</p>
    );
  });
  
  return <div>{processedLines}</div>;
}

// Helper function to get performance color based on score
function getPerformanceColor(score: number): string {
  if (score >= 85) return '#2FFFD5'; // Neon teal/green for elite
  if (score >= 75) return '#00E5FF'; // Soft cyan for strong
  if (score >= 65) return '#FFB84D'; // Amber for needs work
  return '#FF8C42'; // Orange for below average
}

// Helper function to draw corner brackets (HUD element)
function drawCornerBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y);
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.stroke();
}

// Helper function to draw circular progress gauge
function drawCircularGauge(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, score: number, color: string) {
  const startAngle = -Math.PI / 2; // Start at top
  const endAngle = startAngle + (2 * Math.PI * score / 100);
  
  // Background circle
  ctx.strokeStyle = 'rgba(139, 148, 158, 0.2)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Progress arc with glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Score text in center
  ctx.fillStyle = '#E6EDF3';
  ctx.font = `bold ${radius * 0.5}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score.toFixed(1), x, y);
  
  // Label below
  ctx.fillStyle = '#8B949E';
  ctx.font = `14px "Inter", sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('OVERALL', x, y + radius * 0.6);
}

async function generateShareableGraphic(scorecard: any) {
  // Create canvas - optimized for social media
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Color system
  const colors = {
    bg: '#0B0F14',
    accent: '#00E5FF',
    accentSecondary: '#7C7CFF',
    textPrimary: '#E6EDF3',
    textSecondary: '#8B949E',
  };
  
  // Deep charcoal background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Subtle diagonal grid texture (5-10% opacity)
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = -canvas.height; i < canvas.width + canvas.height; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + canvas.height, canvas.height);
    ctx.stroke();
  }
  
  // HUD corner brackets
  const bracketSize = 40;
  const bracketColor = colors.accent;
  drawCornerBrackets(ctx, 60, 60, bracketSize, bracketColor);
  drawCornerBrackets(ctx, canvas.width - 60 - bracketSize, 60, bracketSize, bracketColor);
  drawCornerBrackets(ctx, 60, canvas.height - 60 - bracketSize, bracketSize, bracketColor);
  drawCornerBrackets(ctx, canvas.width - 60 - bracketSize, canvas.height - 60 - bracketSize, bracketSize, bracketColor);
  
  // Logo (top center, matching navbar style)
  const logoY = 60;
  const iconSize = 24;
  const iconGap = 12;
  
  // Set font to measure text widths
  ctx.font = 'bold 32px "Inter", sans-serif';
  ctx.textAlign = 'left';
  const fpsWidth = ctx.measureText('FPS').width;
  const trainerWidth = ctx.measureText('TRAINER').width;
  
  // Calculate total logo width (icon + gap + text)
  const totalLogoWidth = iconSize + iconGap + fpsWidth + trainerWidth;
  const logoStartX = (canvas.width / 2) - (totalLogoWidth / 2);
  
  // Draw CPU icon (simplified geometric representation) - centered
  const iconX = logoStartX;
  const iconY = logoY + 12;
  
  // CPU chip icon - outer rectangle
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(iconX, iconY, iconSize, iconSize);
  
  // CPU chip icon - inner lines (circuit pattern)
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(iconX + 6, iconY + iconSize / 3);
  ctx.lineTo(iconX + iconSize - 6, iconY + iconSize / 3);
  ctx.moveTo(iconX + 6, iconY + (iconSize * 2) / 3);
  ctx.lineTo(iconX + iconSize - 6, iconY + (iconSize * 2) / 3);
  ctx.stroke();
  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(iconX + iconSize / 3, iconY + 6);
  ctx.lineTo(iconX + iconSize / 3, iconY + iconSize - 6);
  ctx.moveTo(iconX + (iconSize * 2) / 3, iconY + 6);
  ctx.lineTo(iconX + (iconSize * 2) / 3, iconY + iconSize - 6);
  ctx.stroke();
  
  // Logo text: "FPS" in white, "TRAINER" in neon - centered
  const logoTextX = iconX + iconSize + iconGap;
  const logoTextY = logoY + 20;
  
  ctx.textBaseline = 'middle';
  
  // "FPS" in white
  ctx.fillStyle = colors.textPrimary;
  ctx.fillText('FPS', logoTextX, logoTextY);
  
  // "TRAINER" in neon
  ctx.fillStyle = colors.accent;
  ctx.fillText('TRAINER', logoTextX + fpsWidth, logoTextY);
  
  // Subtitle below logo (centered)
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '12px "Inter", sans-serif';
  ctx.letterSpacing = '0.08em';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PERFORMANCE SCORECARD', canvas.width / 2, logoTextY + 20);
  ctx.letterSpacing = '0';
  
  // Hero Overall Score - Circular Gauge (top center)
  const overallScore = scorecard.overallScore || scorecard.scorecard?.overallScore || 0;
  const overallColor = getPerformanceColor(overallScore);
  const gaugeX = canvas.width / 2;
  const gaugeY = 240;
  const gaugeRadius = 90;
  
  drawCircularGauge(ctx, gaugeX, gaugeY, gaugeRadius, overallScore, overallColor);
  
  // Label below gauge
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '11px "Inter", sans-serif';
  ctx.letterSpacing = '0.1em';
  ctx.textAlign = 'center';
  ctx.fillText('OVERALL PERFORMANCE SCORE', gaugeX, gaugeY + gaugeRadius + 25);
  ctx.letterSpacing = '0';
  
  // Collect and group ALL metrics
  const sc = scorecard.scorecard || scorecard;
  
  const skillGroups = {
    'AIM & MECHANICS': [] as Array<{ label: string; value: number }>,
    'MOVEMENT & CONTROL': [] as Array<{ label: string; value: number }>,
    'GAME INTELLIGENCE': [] as Array<{ label: string; value: number }>,
    'SURVIVABILITY & ENGAGEMENT': [] as Array<{ label: string; value: number }>,
  };
  
  // Aim & Mechanics
  if (sc.aimAccuracy !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Aim Accuracy', value: sc.aimAccuracy });
  if (sc.firstShotAccuracy !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'First Shot Accuracy', value: sc.firstShotAccuracy });
  if (sc.crosshairPlacement !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Crosshair Placement', value: sc.crosshairPlacement });
  if (sc.trackingStability !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Tracking Stability', value: sc.trackingStability });
  if (sc.reactionTime !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Reaction Time', value: sc.reactionTime });
  if (sc.recoilControl !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Recoil Control', value: sc.recoilControl });
  if (sc.flickTiming !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Flick Timing', value: sc.flickTiming });
  if (sc.adsTiming !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'ADS Timing', value: sc.adsTiming });
  if (sc.strafingAimQuality !== undefined) skillGroups['AIM & MECHANICS'].push({ label: 'Strafing Aim', value: sc.strafingAimQuality });
  
  // Movement & Control
  if (sc.movementMechanics !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Movement', value: sc.movementMechanics });
  if (sc.strafingTechnique !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Strafing Technique', value: sc.strafingTechnique });
  if (sc.rotationEfficiency !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Rotation Efficiency', value: sc.rotationEfficiency });
  if (sc.mechanicalConsistency !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Mechanical Consistency', value: sc.mechanicalConsistency });
  if (sc.slideTiming !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Slide Timing', value: sc.slideTiming });
  if (sc.jumpShotUsage !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Jump Shot Usage', value: sc.jumpShotUsage });
  if (sc.peekingTechnique !== undefined) skillGroups['MOVEMENT & CONTROL'].push({ label: 'Peeking Technique', value: sc.peekingTechnique });
  
  // Game Intelligence
  if (sc.gameSense !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Game Sense', value: sc.gameSense });
  if (sc.mapAwareness !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Map Awareness', value: sc.mapAwareness });
  if (sc.positioning !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Positioning', value: sc.positioning });
  if (sc.situationalAwareness !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Situational Awareness', value: sc.situationalAwareness });
  if (sc.coverUsage !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Cover Usage', value: sc.coverUsage });
  if (sc.angleSelection !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Angle Selection', value: sc.angleSelection });
  if (sc.predictability !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Predictability', value: sc.predictability });
  if (sc.awarenessChecks !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Awareness Checks', value: sc.awarenessChecks });
  if (sc.rotationTiming !== undefined) skillGroups['GAME INTELLIGENCE'].push({ label: 'Rotation Timing', value: sc.rotationTiming });
  
  // Survivability & Engagement
  if (sc.engagementQuality !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Engagement', value: sc.engagementQuality });
  if (sc.survivability !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Survivability', value: sc.survivability });
  if (sc.confidenceRating !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Confidence Rating', value: sc.confidenceRating });
  if (sc.openingShotTiming !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Opening Shot Timing', value: sc.openingShotTiming });
  if (sc.fightInitiations !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Fight Initiations', value: sc.fightInitiations });
  if (sc.weaponSwapSpeed !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Weapon Swap Speed', value: sc.weaponSwapSpeed });
  if (sc.reloadTiming !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Reload Timing', value: sc.reloadTiming });
  if (sc.disengagementTiming !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Disengagement Timing', value: sc.disengagementTiming });
  if (sc.lanePressure !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Lane Pressure', value: sc.lanePressure });
  if (sc.tempoRating !== undefined) skillGroups['SURVIVABILITY & ENGAGEMENT'].push({ label: 'Tempo Rating', value: sc.tempoRating });
  
  // Render skill groups in card-based layout
  let currentY = 400;
  const cardPadding = 30;
  const sectionSpacing = 30; // Space between sections
  const headerToCardSpacing = 24; // Minimum spacing between header and card (enforced)
  const cardWidth = canvas.width - (cardPadding * 2);
  const cardCornerRadius = 12;
  
  Object.entries(skillGroups).forEach(([groupName, metrics]) => {
    if (metrics.length === 0) return;
    
    // Group header - OUTSIDE and ABOVE the card
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.letterSpacing = '0.08em';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(groupName, cardPadding, currentY);
    ctx.letterSpacing = '0';
    
    // Enforce minimum 24px spacing between header and card
    currentY += 18 + headerToCardSpacing; // Header height + enforced spacing
    
    // Calculate card dimensions
    const metricCols = 3;
    const metricRows = Math.ceil(metrics.length / metricCols);
    const metricCardHeight = 75; // Fixed height per metric card
    const cardInternalPadding = 20; // Padding inside card
    const cardHeight = (metricRows * metricCardHeight) + (cardInternalPadding * 2);
    const cardX = cardPadding;
    const cardY = currentY;
    
    // Card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    roundRect(ctx, cardX + 4, cardY + 4, cardWidth, cardHeight, cardCornerRadius);
    ctx.fill();
    
    // Card background
    ctx.fillStyle = 'rgba(230, 237, 243, 0.03)';
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardCornerRadius);
    ctx.fill();
    
    // Card border (subtle)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardCornerRadius);
    ctx.stroke();
    
    // Render metrics in 3-column grid within card
    const metricColWidth = cardWidth / metricCols;
    
    metrics.forEach((metric, index) => {
      const col = index % metricCols;
      const row = Math.floor(index / metricCols);
      
      // Calculate metric card boundaries (strict container)
      const metricCardX = cardX + (col * metricColWidth);
      const metricCardY = cardY + cardInternalPadding + (row * metricCardHeight);
      const metricCardWidth = metricColWidth;
      
      // Center point within THIS metric card only
      const metricX = metricCardX + (metricCardWidth / 2);
      
      const metricColor = getPerformanceColor(metric.value);
      
      // TOP ZONE: Label (metric name only)
      const labelY = metricCardY + 8; // Fixed position from top of card
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '10px "Inter", sans-serif';
      ctx.letterSpacing = '0.08em';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(metric.label.toUpperCase(), metricX, labelY);
      ctx.letterSpacing = '0';
      
      // MIDDLE ZONE: Numeric score (vertically centered within THIS card)
      const scoreY = metricCardY + (metricCardHeight / 2); // True vertical center of THIS card
      ctx.fillStyle = metricColor;
      ctx.font = `bold 30px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metric.value.toFixed(1), metricX, scoreY);
      
      // BOTTOM ZONE: Thin accent divider line
      const dividerY = metricCardY + metricCardHeight - 12; // Fixed position from bottom
      const dividerWidth = metricCardWidth - 20;
      const dividerHeight = 1;
      const dividerX = metricCardX + 10;
      
      // Background line
      ctx.fillStyle = 'rgba(139, 148, 158, 0.1)';
      ctx.fillRect(dividerX, dividerY, dividerWidth, dividerHeight);
      
      // Progress line (only add glow for elite scores 85+)
      if (metric.value >= 85) {
        ctx.shadowColor = metricColor;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = metricColor;
      ctx.fillRect(dividerX, dividerY, (dividerWidth * metric.value) / 100, dividerHeight);
      ctx.shadowBlur = 0;
    });
    
    // Move to next section (card height + spacing)
    currentY += cardHeight + sectionSpacing;
  });
  
  // Branding at bottom
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '14px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('fpstrainer.io', canvas.width / 2, canvas.height - 40);
  
  // Helper function for rounded rectangles
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  // Convert to image and download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob');
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fpstrainer-scorecard-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
