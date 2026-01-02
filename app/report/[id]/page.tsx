"use client";

import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle, Target, Activity, Map, Brain, Swords, Shield } from "lucide-react";
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
    
    // Poll every 10 seconds (less frequent)
    pollInterval = setInterval(() => {
      if (isMounted && !isFetching) {
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

  if (loading || !report) {
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

  // Show processing state for any non-completed status
  if (report.processingStatus !== 'COMPLETED') {
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
            <h1 className="text-3xl font-bold text-white mb-6">Coaching Report</h1>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{report.aiReportMarkdown || 'No report content available.'}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Scorecard Sidebar - Right Side (1 column) */}
        {hasScorecard && (
          <div className="lg:col-span-1">
            <div className="bg-surface p-6 rounded-2xl border border-white/10 sticky top-4">
              <h2 className="text-xl font-bold text-white mb-6">Performance Scorecard</h2>
              
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
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
  const tier = getTier(value);
  const color = getScoreColor(value);

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
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-gray-500">/ 100</span>
      </div>
      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: color,
          }}
        />
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
