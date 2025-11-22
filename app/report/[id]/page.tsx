"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const client = generateClient<Schema>();

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      try {
        // List reports and filter by reportId since we don't have userId in URL
        const { data: reports } = await client.models.OpsCoachReport.list({
          filter: { reportId: { eq: id as string } }
        });
        
        if (reports && reports.length > 0) {
          setReport(reports[0]);
          if (reports[0].processingStatus === 'COMPLETED' || reports[0].processingStatus === 'FAILED') {
            setLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchReport();
    const interval = setInterval(fetchReport, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [id]);

  if (!report) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neon" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-12">
      {report.processingStatus === 'COMPLETED' ? (
        <div className="space-y-8">
          <div className="bg-surface p-8 rounded-2xl border border-white/10">
            <h1 className="text-3xl font-bold text-white mb-4">Coaching Report</h1>
            <div className="prose prose-invert max-w-none">
               <ReactMarkdown>{report.aiReportMarkdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : report.processingStatus === 'FAILED' ? (
        <div className="text-center text-danger">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Analysis Failed</h2>
          <p>Something went wrong. Please try again.</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <Loader2 size={48} className="mx-auto mb-4 text-neon animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Gameplay...</h2>
          <p className="text-gray-400">This usually takes 1-2 minutes.</p>
          <p className="text-sm text-gray-500 mt-4">Status: {report.processingStatus}</p>
        </div>
      )}
    </div>
  );
}

