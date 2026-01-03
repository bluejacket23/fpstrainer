"use client";

import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import Link from "next/link";
import { Play, Clock, CheckCircle, AlertTriangle, Loader2, Target, Activity, Map, Brain, Swords, Shield, Info } from "lucide-react";

const client = generateClient<Schema>();

export default function DashboardPage() {
  return (
    <Authenticator>
      <DashboardContent />
    </Authenticator>
  );
}

function DashboardContent() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [clipsRemaining, setClipsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchReports = async () => {
      try {
        const userId = user.userId || user.sub;
        
        // Fetch reports
        let reportsData = null;
        try {
          // Try custom list query first (bypasses owner() auth issues)
          try {
            const customResult = await client.queries.listReportsCustom();
            console.log('Custom query result:', customResult);
            if (customResult.data && Array.isArray(customResult.data)) {
              // Parse JSON strings if needed
              reportsData = customResult.data
                .map((r: any) => {
                  // If it's a string, parse it
                  if (typeof r === 'string') {
                    try {
                      return JSON.parse(r);
                    } catch (e) {
                      console.error('Failed to parse report:', e);
                      return null;
                    }
                  }
                  // If it's already an object, use it
                  return r;
                })
                .filter((r: any) => r !== null && r !== undefined && r.reportId);
              console.log(`Got ${reportsData.length} reports from custom query`);
            } else {
              console.log('Custom query returned no data or non-array:', customResult);
            }
          } catch (customError: any) {
            console.error('Custom query failed:', customError);
            console.error('Custom query error details:', JSON.stringify(customError, null, 2));
            if (customError.errors) {
              console.error('Custom query GraphQL errors:', customError.errors);
            }
          }
          
          // Fallback to list query if custom query didn't work
          if (!reportsData || reportsData.length === 0) {
            const result = await client.models.OpsCoachReport.list();
            
            // Log errors to understand what's happening
            if (result.errors && result.errors.length > 0) {
              console.warn('GraphQL errors:', result.errors.length);
              // Log first error details
              if (result.errors[0]) {
                console.warn('First error:', JSON.stringify(result.errors[0], null, 2));
              }
            }
            
            // Get all reports - filter out null/undefined
            const allReports = (result.data || []).filter((r: any) => r !== null && r !== undefined);
            console.log(`Raw reports from list query: ${allReports.length}`);
            
            // The owner() authorization should already filter to only this user's reports
            // Trust owner() auth - all returned reports belong to this user
            // Just filter out null/undefined and ensure reportId exists
            reportsData = allReports.filter((r: any) => {
              return r !== null && r !== undefined && r.reportId;
            });
            
            console.log(`Filtered to ${reportsData.length} valid reports for user ${userId}`);
          }
        } catch (error) {
          console.error('Error fetching reports:', error);
          reportsData = [];
        }
        
        if (reportsData && Array.isArray(reportsData)) {
          // Normalize reports
          const normalizedReports = reportsData
            .filter((report: any) => report !== null && report !== undefined)
            .map((report: any) => {
              try {
                if (!report) return null;

                // Parse aiReportJson if it's a string
                let aiReportJson = report.aiReportJson || null;
                if (aiReportJson && typeof aiReportJson === 'string') {
                  try {
                    aiReportJson = JSON.parse(aiReportJson);
                  } catch (e) {
                    console.error('Failed to parse aiReportJson:', e);
                    aiReportJson = null;
                  }
                }

                // Parse frameUrls if it's a string
                let frameUrls = report.frameUrls || null;
                if (frameUrls && typeof frameUrls === 'string') {
                  try {
                    frameUrls = JSON.parse(frameUrls);
                  } catch (e) {
                    frameUrls = [];
                  }
                }

                return {
                  ...report,
                  aiReportJson: aiReportJson || null,
                  frameUrls: Array.isArray(frameUrls) ? frameUrls : [],
                  thumbnailUrl: report.thumbnailUrl || null,
                };
              } catch (error) {
                console.error('Error normalizing report:', error);
                return null;
              }
            })
            .filter((r: any) => r !== null && r !== undefined && r.reportId);

          // Sort by timestamp (newest first)
          const sortedReports = normalizedReports.sort((a: any, b: any) => {
            const timeA = a.timestamp || a.createdAt || '0';
            const timeB = b.timestamp || b.createdAt || '0';
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });
          
          setReports(sortedReports);

          // Calculate statistics
          const completedReports = normalizedReports.filter(
            (r: any) => r.processingStatus === 'COMPLETED' && r.aiReportJson?.scorecard
          );

          if (completedReports.length > 0) {
            const totals = {
              overallScore: 0,
              aimAccuracy: 0,
              movementMechanics: 0,
              positioning: 0,
              gameSense: 0,
              engagementQuality: 0,
            };

            let highScore = 0;

            completedReports.forEach((report: any) => {
              const scorecard = report.aiReportJson.scorecard;
              if (scorecard) {
                const overall = scorecard.overallScore || 0;
                if (overall > highScore) {
                  highScore = overall;
                }
                
                totals.overallScore += overall;
                totals.aimAccuracy += scorecard.aimAccuracy || 0;
                totals.movementMechanics += scorecard.movementMechanics || 0;
                totals.positioning += scorecard.positioning || 0;
                totals.gameSense += scorecard.gameSense || 0;
                totals.engagementQuality += scorecard.engagementQuality || 0;
              }
            });

            const count = completedReports.length;
            setStats({
              overallAvg: totals.overallScore / count,
              aimAvg: totals.aimAccuracy / count,
              movementAvg: totals.movementMechanics / count,
              positioningAvg: totals.positioning / count,
              gameSenseAvg: totals.gameSense / count,
              engagementAvg: totals.engagementQuality / count,
              totalReports: normalizedReports.length,
              completedReports: completedReports.length,
              highScore: highScore,
              highScoreTier: highScore > 0 ? getTier(highScore) : null,
            });
          } else {
            setStats({
              totalReports: normalizedReports.length,
              completedReports: 0,
            });
          }
        }
      } catch (e) {
        console.error('Error fetching reports:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    
    // Auto-refresh every 10 seconds to catch new reports
    const refreshInterval = setInterval(() => {
      fetchReports();
    }, 10000);
    
    // Fetch clips remaining from User model
    const fetchClipsRemaining = async () => {
      try {
        const userId = user.userId || user.sub;
        const userResult = await client.models.User.get({ userId });
        if (userResult.data) {
          setClipsRemaining(userResult.data.clipsRemaining ?? 0);
        }
      } catch (error) {
        console.error('Error fetching clips remaining:', error);
      }
    };
    
    fetchClipsRemaining();
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20 bg-surface rounded-2xl border border-white/10">
            <Loader2 className="mx-auto text-neon animate-spin mb-4" size={48} />
            <p className="text-white">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Reports</h1>
            {clipsRemaining !== null && (
              <p className="text-sm text-gray-400 font-mono mt-1">
                Clips Remaining: <span className="text-neon font-bold">{clipsRemaining}</span>
              </p>
            )}
          </div>
          <Link href="/upload">
            <button 
              className="bg-neon text-black px-4 py-2 rounded font-bold hover:bg-neon/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={clipsRemaining !== null && clipsRemaining <= 0}
            >
              {clipsRemaining !== null && clipsRemaining <= 0 ? 'No Clips Remaining' : 'New Analysis'}
            </button>
          </Link>
        </div>

        {/* Scoring Section at Top */}
        {stats && stats.completedReports > 0 && (
          <div className="mb-8 bg-surface rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cumulative Performance Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <StatCard
                label="Overall Avg"
                value={stats.overallAvg?.toFixed(1) || '0.0'}
                icon={<Target />}
                tier={stats.overallAvg ? getTier(stats.overallAvg) : null}
                score={stats.overallAvg}
                isHighlighted={true}
              />
              <StatCard 
                label="Aim Avg" 
                value={stats.aimAvg?.toFixed(1) || '0.0'} 
                icon={<Target />}
                score={stats.aimAvg}
              />
              <StatCard 
                label="Movement Avg" 
                value={stats.movementAvg?.toFixed(1) || '0.0'} 
                icon={<Activity />}
                score={stats.movementAvg}
              />
              <StatCard 
                label="Positioning Avg" 
                value={stats.positioningAvg?.toFixed(1) || '0.0'} 
                icon={<Map />}
                score={stats.positioningAvg}
              />
              <StatCard 
                label="Game Sense Avg" 
                value={stats.gameSenseAvg?.toFixed(1) || '0.0'} 
                icon={<Brain />}
                score={stats.gameSenseAvg}
              />
              <StatCard 
                label="Engagement Avg" 
                value={stats.engagementAvg?.toFixed(1) || '0.0'} 
                icon={<Swords />}
                score={stats.engagementAvg}
              />
              <StatCard
                label="Overall High Score"
                value={stats.highScore?.toFixed(1) || '0.0'}
                icon={<Target />}
                tier={stats.highScoreTier}
                score={stats.highScore}
                isHighlighted={true}
              />
            </div>
          </div>
        )}

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-white/10">
            <h2 className="text-xl text-white mb-4">No reports yet</h2>
            <Link href="/upload">
              <button className="text-neon hover:underline">Upload your first clip</button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports
              .filter((report) => report && report.reportId)
              .map((report) => (
                <ReportCard key={report.reportId} report={report} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tier, score, isHighlighted }: any) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreColor = score !== undefined && score !== null ? getScoreColor(score) : '#ffffff';
  const cardTier = tier || (score !== undefined && score !== null ? getTier(score) : null);
  const numericValue = parseFloat(value) || 0;

  // Animate score on mount
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(numericValue, increment * step);
      setAnimatedScore(current);
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedScore(numericValue);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div className="relative">
      <div
        className={`bg-white/5 rounded-lg p-4 border ${isHighlighted ? 'border-neon/50 shadow-[0_0_10px_rgba(0,255,157,0.2)]' : 'border-white/10'} ${cardTier ? 'tier-tooltip-parent' : ''}`}
        onMouseEnter={() => cardTier && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="text-neon">{icon}</div>
          <span className="text-xs text-gray-400 font-mono">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>{value}</span>
          {/* Only show tier badge for overall average, not high score */}
          {isHighlighted && cardTier && label === 'Overall Avg' && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                cardTier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                cardTier.color === 'green' ? 'bg-green-500/20 text-green-400' :
                cardTier.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                cardTier.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                cardTier.color === 'red' ? 'bg-red-500/20 text-red-400' :
                cardTier.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                cardTier.color === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}
            >
              {cardTier.name}
            </span>
          )}
        </div>
        {score !== undefined && score !== null && (
          <div className="mt-3 relative">
            {/* Circular progress */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={scoreColor}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - animatedScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
          </div>
        )}
      </div>

      {showTooltip && cardTier && (
        <div
          className="absolute bottom-full right-0 mb-2 bg-black border-2 border-neon p-4 rounded-lg shadow-lg z-[99999] min-w-[250px]"
          style={{ zIndex: 99999 }}
        >
          <h3 className="text-white font-bold mb-2 text-sm">Tier System</h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="text-gray-300">God: 98-100 (Black/Flame)</div>
            <div className="text-gray-300">Legendary: 95-97.9 (Gold)</div>
            <div className="text-gray-300">Master: 90-94.9 (Purple)</div>
            <div className="text-gray-300">Elite: 80-89.9 (Red)</div>
            <div className="text-gray-300">Advanced: 70-79.9 (Orange)</div>
            <div className="text-gray-300">Competent: 60-69.9 (Yellow)</div>
            <div className="text-gray-300">Skilled: 50-59.9 (Green)</div>
            <div className="text-gray-300">Rookie: 0-49.9 (Blue)</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: any) {
  return (
    <Link href={`/report/${report.reportId}`}>
      <div className="bg-surface p-6 rounded-xl border border-white/10 hover:border-neon/50 transition-all cursor-pointer group h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white/5 rounded-lg group-hover:bg-neon/10 transition-colors">
            <Play className="text-neon" size={24} />
          </div>
          <StatusBadge status={report.processingStatus || 'UNKNOWN'} />
        </div>

        {/* Thumbnail */}
        {report.thumbnailUrl && (
          <div className="mb-4 rounded-lg overflow-hidden bg-white/5">
            <img
              src={report.thumbnailUrl}
              alt="Report thumbnail"
              className="w-full h-32 object-cover"
              onError={async (e) => {
                // If thumbnail URL expired, try to regenerate it
                try {
                  // TODO: Call get-thumbnail-url Lambda to regenerate URL
                  // For now, just hide the broken image
                  (e.target as HTMLImageElement).style.display = 'none';
                } catch (error) {
                  (e.target as HTMLImageElement).style.display = 'none';
                }
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">
            Analysis {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'N/A'}
          </h3>
          <p className="text-sm text-gray-400">
            {report.timestamp ? new Date(report.timestamp).toLocaleTimeString() : ''}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} /> 60s Clip
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1">
        <CheckCircle size={12} /> Ready
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1">
        <AlertTriangle size={12} /> Failed
      </span>
    );
  }
  // Don't show processing status - just show nothing or a subtle indicator
  return null;
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
