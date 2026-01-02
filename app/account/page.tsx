"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { CreditCard, X, Check, AlertCircle, Disc } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  return (
    <Authenticator>
      <AccountContent />
    </Authenticator>
  );
}

function AccountContent({ user }: any) {
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  
  // TODO: Replace with actual subscription data from your backend
  const currentPlan = {
    name: "RECRUIT",
    price: "$0",
    clips: "1 Clip/Month",
    status: "active"
  };

  const plans = [
    { name: "RECRUIT", price: "$0", clips: "1 Clip/Month", color: "border-gray-700", free: true },
    { name: "ROOKIE", price: "$5", clips: "10 Clips/Month", color: "border-neon" },
    { name: "COMPETITIVE", price: "$10", clips: "25 Clips/Month", color: "border-cyber" },
    { name: "ELITE", price: "$15", clips: "50 Clips/Month", color: "border-electric", popular: true },
    { name: "PRO", price: "$29", clips: "150 Clips/Month", color: "border-purple-500" },
    { name: "GOD", price: "$59", clips: "500 Clips/Month", color: "border-yellow-500", glow: "shadow-[0_0_40px_rgba(255,215,0,0.3)]" },
  ];

  return (
    <div className="min-h-screen bg-background text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-black font-display text-white mb-8 tracking-widest">ACCOUNT SETTINGS</h1>

        {/* Current Plan */}
        <div className="cyber-card p-8 border-l-2 border-neon bg-neon/5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display text-white mb-2">Current Plan</h2>
              <div className="text-4xl font-black text-neon mb-1 font-display">{currentPlan.name}</div>
              <div className="text-sm font-mono text-gray-400">{currentPlan.price} / {currentPlan.clips}</div>
            </div>
            <Link href="/#pricing">
              <button className="px-6 py-3 bg-neon text-black font-bold font-display tracking-widest text-sm hover:bg-white transition-all">
                UPGRADE PLAN
              </button>
            </Link>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-display text-white mb-6">AVAILABLE PLANS</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {plans.map((plan) => {
              const planFeatures = getPlanFeatures(plan.name);
              return (
                <div
                  key={plan.name}
                  className={`relative p-8 border ${plan.color} ${plan.name === currentPlan.name ? 'bg-neon/10' : 'bg-surface/50'} flex flex-col items-center justify-between min-h-[450px] transition-all hover:bg-surface ${plan.popular ? 'shadow-[0_0_30px_rgba(0,255,157,0.2)]' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 right-3 bg-neon text-white text-xs font-bold px-3 py-1.5 font-mono tracking-widest rounded-sm shadow-[0_0_20px_rgba(0,255,157,0.8)] border-2 border-neon/50 z-50" style={{ backgroundColor: '#000000', textShadow: '0 0 10px rgba(0,255,157,0.8)', zIndex: 99999 }}>
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="w-full text-center">
                    <h3 className="text-2xl font-black font-display text-white mb-2 tracking-widest">{plan.name}</h3>
                    <div className="text-5xl font-black text-white mb-1 font-display">{plan.price}</div>
                    <div className="text-xs font-mono text-gray-500 mb-8">PER MONTH</div>
                  </div>

                  <div className="w-full border-t border-white/10 py-6 space-y-3 flex-1">
                    <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-300 mb-4">
                      <Disc size={14} className={plan.name === currentPlan.name || plan.popular ? "text-neon" : "text-gray-500"} />
                      <span className="font-bold">{plan.clips}</span>
                    </div>
                    {planFeatures && planFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-xs font-mono text-gray-400">
                        <Check size={12} className={`mt-1 flex-shrink-0 ${plan.name === currentPlan.name || plan.popular ? "text-neon" : "text-gray-600"}`} />
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.name === currentPlan.name ? (
                    <button className="w-full py-3 font-bold font-display tracking-widest text-sm border-2 border-neon text-neon bg-neon/10 rounded-sm transition-all" disabled>
                      CURRENT PLAN
                    </button>
                  ) : (
                    <Link href="/#pricing" className="w-full">
                      <button className={`w-full py-3 font-bold font-display tracking-widest text-sm border-2 rounded-sm transition-all ${
                        plan.free 
                          ? 'border-neon bg-neon/30 text-neon hover:bg-neon/50' 
                          : 'border-white/50 bg-white/15 text-white hover:bg-white/25 hover:border-white/70'
                      }`}>
                        {plan.free ? "TRY FREE" : "SELECT"}
                      </button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancel Subscription */}
        <div className="cyber-card p-8 border-l-2 border-red-500/50 bg-red-500/5">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-400 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-xl font-bold font-display text-white mb-2">Cancel Subscription</h3>
              <p className="text-sm text-gray-400 font-mono mb-4">
                Canceling your subscription will stop automatic renewals. You'll retain access until the end of your current billing period.
              </p>
              <button className="px-6 py-3 border border-red-500/50 text-red-400 font-bold font-display tracking-widest text-sm hover:bg-red-500/10 transition-all">
                CANCEL SUBSCRIPTION
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="cyber-card p-8 border border-white/10 bg-surface/50 mt-8">
          <h3 className="text-xl font-bold font-display text-white mb-4">Account Information</h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user?.signInDetails?.loginId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-white font-mono text-xs">{user?.userId || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPlanFeatures(planName: string): string[] {
  const featuresMap: { [key: string]: string[] } = {
    "RECRUIT": [
      "No card required",
      "Basic AI analysis",
      "20+ metric scorecard",
      "Key moments breakdown",
      "Personalized coaching feedback"
    ],
    "ROOKIE": [
      "Metrics Dashboard",
      "Advanced AI analysis",
      "Cumulative performance stats",
      "Training drills with instructions",
      "Frame-by-frame analysis",
      "Tier system tracking"
    ],
    "COMPETITIVE": [
      "Advanced Statistical analysis",
      "Personalized drills",
      "Timeline-based breakdowns",
      "Engagement quality metrics",
      "Positioning heatmaps",
      "Movement mechanics scoring"
    ],
    "ELITE": [
      "Everything in Competitive +",
      "Custom weekly training plan generator",
      "Advanced metrics (Lane Pressure, Tempo Rating)",
      "Predictability score analysis",
      "Mechanical consistency tracking",
      "Confidence rating insights"
    ],
    "PRO": [
      "Everything in Elite +",
      "Priority queue / faster processing",
      "First-shot hit rate tracking",
      "Engagement win rate analysis",
      "Average TTK calculations",
      "Cover usage efficiency metrics"
    ],
    "GOD": [
      "Everything in Pro +",
      "No rate limits",
      "Personalized Branded Reports",
      "Exclusive customization requests",
      "Advanced comparison analytics",
      "Export reports to PDF"
    ]
  };
  return featuresMap[planName] || [];
}


