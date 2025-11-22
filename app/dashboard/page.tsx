"use client";

import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { Play, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <Authenticator>
      {({ user }) => (
        <div className="min-h-screen p-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Your Reports</h1>
              <Link href="/upload">
                <button className="bg-neon text-black px-4 py-2 rounded font-bold hover:bg-neon/90 transition-colors">
                  New Analysis
                </button>
              </Link>
            </div>
            <ReportList user={user} />
          </div>
        </div>
      )}
    </Authenticator>
  );
}

function ReportList({ user }: any) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading] = useState(false); // Backend wiring pending

  if (reports.length === 0) {
    return (
      <div className="text-center py-20 bg-surface rounded-2xl border border-white/10">
        <h2 className="text-xl text-white mb-4">No reports yet</h2>
        <Link href="/upload">
          <button className="text-neon hover:underline">Upload your first clip</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <Link href={`/report/${report.reportId}`} key={report.reportId}>
          <div className="bg-surface p-6 rounded-xl border border-white/10 hover:border-neon/50 transition-all cursor-pointer group h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-lg group-hover:bg-neon/10 transition-colors">
                <Play className="text-neon" size={24} />
              </div>
              <StatusBadge status={report.processingStatus} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                Analysis {new Date(report.timestamp).toLocaleDateString()}
              </h3>
              <p className="text-sm text-gray-400">
                {new Date(report.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-gray-400">
              <Clock size={14} /> 60s Clip
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Ready</span>;
  }
  if (status === 'FAILED') {
    return <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Failed</span>;
  }
  return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Processing</span>;
}

