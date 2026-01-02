"use client";

import Link from "next/link";
import { 
  ArrowRight, Check, Crosshair, Shield, Zap, Target, Activity, Map, Brain, 
  Swords, Settings, Eye, BarChart3, Video, UserCheck, Cpu, Disc, Upload, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'how-it-works', 'features', 'pricing'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-background text-white overflow-x-hidden selection:bg-cyber selection:text-white">
      
      {/* HERO SECTION */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-grid z-0 opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-hero-glow blur-[150px] opacity-20 animate-pulse-slow" />
        <div className="scanlines absolute inset-0 z-10 opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-20 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Floating HUD Element */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 px-4 py-1 border border-neon/40 bg-neon/5 backdrop-blur-sm rounded-sm text-neon font-mono text-xs tracking-[0.2em]">
                <span className="w-2 h-2 bg-neon animate-ping" />
                SYSTEM ONLINE // V.2.0
              </div>
            </div>

            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-6 font-display leading-[0.85] uppercase glitch-text" data-text="FPS TRAINER">
              FPS TRAINER
            </h1>
            
            <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon via-white to-cyber mb-10 font-display tracking-wide">
              DOMINATE THE SERVER
            </h2>
            
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-mono border-l-2 border-cyber pl-6 text-left">
              &gt; ANALYZING GAMEPLAY... <br/>
              &gt; DETECTING FLAWS... <br/>
              &gt; OPTIMIZING PERFORMANCE...
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/upload">
                <button className="cyber-button relative group bg-neon text-black px-10 py-5 font-bold text-xl hover:bg-white transition-all duration-200 hover:scale-105 shadow-[0_0_30px_rgba(0,255,157,0.4)]">
                  <span className="relative z-10 flex items-center gap-2 font-display tracking-widest">
                    INITIATE ANALYSIS <ArrowRight size={20} />
                  </span>
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-32 relative bg-surface/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">How It Works</h2>
            <p className="text-gray-400 font-mono text-sm">AI-POWERED GAMEPLAY ANALYSIS FOR CALL OF DUTY, BATTLEFIELD, APEX LEGENDS, COUNTER-STRIKE, VALORANT & MORE</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <HowItWorksStep
              number="01"
              icon={<Upload className="w-12 h-12" />}
              title="Upload Clip"
              description="Upload your gameplay clip (up to 60 seconds, max 100MB). Our system supports all major FPS games including Call of Duty, Battlefield, Apex Legends, Counter-Strike, and Valorant."
            />
            <HowItWorksStep
              number="02"
              icon={<Brain className="w-12 h-12" />}
              title="AI Analysis"
              description="Advanced AI analyzes every frame of your gameplay, evaluating aim precision, positioning, movement mechanics, game sense, and decision-making. Get comprehensive metrics and insights."
            />
            <HowItWorksStep
              number="03"
              icon={<FileText className="w-12 h-12" />}
              title="Get Scoring & Feedback"
              description="Receive detailed scoring across 20+ metrics, personalized coaching feedback, key moments breakdown, and actionable training recommendations to elevate your gameplay."
            />
          </div>
        </div>
      </section>

      {/* 10-DIMENSION ANALYSIS GRID */}
      <section id="features" className="py-32 relative bg-surface border-t border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-20 flex items-end justify-between border-b border-white/10 pb-6">
            <div>
              <h2 className="text-5xl font-black font-display text-white mb-2">SYSTEM MODULES</h2>
              <p className="text-cyber font-mono text-sm tracking-widest">/// COMPREHENSIVE GAMEPLAY DECONSTRUCTION</p>
            </div>
            <Cpu className="text-white/20 w-16 h-16" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Target />, title: "AIM & ACCURACY", desc: "Micro-adjustment precision & recoil patterns." },
              { icon: <Activity />, title: "MOVEMENT TECH", desc: "Strafing, slide-cancels, & pathing efficiency." },
              { icon: <Map />, title: "POSITIONING", desc: "Angle isolation & exposure heatmap analysis." },
              { icon: <Brain />, title: "GAME SENSE", desc: "Decision logic, rotation timing & awareness." },
              { icon: <Swords />, title: "ENGAGEMENT", desc: "Fight initiation & trade potential metrics." },
              { icon: <Settings />, title: "LOADOUT OPT", desc: "Meta-analysis & attachment tuning." },
              { icon: <Shield />, title: "SURVIVABILITY", desc: "Evasiveness & life-preservation rating." },
              { icon: <BarChart3 />, title: "METRICS", desc: "Deep-dive statistical performance data." },
              { icon: <UserCheck />, title: "COACHING", desc: "AI-generated training regimen.", highlight: true },
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 relative overflow-hidden bg-void">
        {/* Gradient Orb */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-electric/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">Select Tier</h2>
            <p className="text-gray-400 font-mono text-sm">UNLOCK ADVANCED TACTICAL DATA</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <PricingCard 
              title="RECRUIT" 
              price="$0" 
              clips="1 Clip/Month"
              features={[
                "No card required",
                "Basic AI analysis",
                "20+ metric scorecard",
                "Key moments breakdown",
                "Personalized coaching feedback"
              ]}
              color="border-gray-700"
              free
            />
            <PricingCard 
              title="ROOKIE" 
              price="$5" 
              clips="10 Clips/Month"
              features={[
                "Metrics Dashboard",
                "Advanced AI analysis",
                "Cumulative performance stats",
                "Training drills with instructions",
                "Frame-by-frame analysis",
                "Tier system tracking"
              ]}
              color="border-neon"
            />
            <PricingCard 
              title="COMPETITIVE" 
              price="$10" 
              clips="25 Clips/Month"
              features={[
                "Advanced Statistical analysis",
                "Personalized drills",
                "Timeline-based breakdowns",
                "Engagement quality metrics",
                "Positioning heatmaps",
                "Movement mechanics scoring"
              ]}
              color="border-cyber"
              glow="shadow-[0_0_30px_rgba(0,255,157,0.2)]"
            />
            <PricingCard 
              title="ELITE" 
              price="$15" 
              clips="50 Clips/Month"
              features={[
                "Everything in Competitive +",
                "Custom weekly training plan generator",
                "Advanced metrics (Lane Pressure, Tempo Rating)",
                "Predictability score analysis",
                "Mechanical consistency tracking",
                "Confidence rating insights"
              ]}
              color="border-electric"
              popular
            />
            <PricingCard 
              title="PRO" 
              price="$29" 
              clips="150 Clips/Month"
              features={[
                "Everything in Elite +",
                "Priority queue / faster processing",
                "First-shot hit rate tracking",
                "Engagement win rate analysis",
                "Average TTK calculations",
                "Cover usage efficiency metrics"
              ]}
              color="border-purple-500"
            />
            <PricingCard 
              title="GOD" 
              price="$59" 
              clips="500 Clips/Month"
              features={[
                "Everything in Pro +",
                "No rate limits",
                "Personalized Branded Reports",
                "Exclusive customization requests",
                "Advanced comparison analytics",
                "Export reports to PDF"
              ]}
              color="border-yellow-500"
              glow="shadow-[0_0_40px_rgba(255,215,0,0.3)]"
            />
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="py-8 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-display font-bold text-2xl tracking-widest">
            FPS<span className="text-neon">TRAINER</span>
          </div>
          <div className="flex gap-6 font-mono text-xs text-gray-400">
            <Link href="/terms" className="hover:text-neon transition-colors">Terms of Service</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-neon transition-colors">Privacy Policy</Link>
          </div>
          <div className="font-mono text-xs text-gray-600">
            SYSTEM STATUS: ONLINE
          </div>
        </div>
      </footer>
    </main>
  );
}

function HowItWorksStep({ number, icon, title, description }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="cyber-card p-8 border border-white/10 bg-surface/50 flex flex-col items-center text-center"
    >
      <div className="text-6xl font-black text-neon/20 mb-4 font-display">{number}</div>
      <div className="text-neon mb-4">{icon}</div>
      <h3 className="text-xl font-bold font-display text-white mb-2 tracking-wide">{title}</h3>
      <p className="text-sm text-gray-500 font-mono leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, highlight, index }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
      className={`cyber-card p-8 border-l-2 ${highlight ? 'border-neon bg-neon/5' : 'border-white/20 bg-surface'} hover:border-neon transition-all group`}
    >
      <div className={`mb-4 ${highlight ? 'text-neon' : 'text-gray-400 group-hover:text-white'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display text-white mb-2 tracking-wide">{title}</h3>
      <p className="text-sm text-gray-500 font-mono leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function PricingCard({ title, price, clips, features, color, glow, popular, free }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative p-8 border ${color} bg-surface/50 flex flex-col items-center justify-between min-h-[450px] transition-all hover:bg-surface ${glow || ''} ${popular ? 'overflow-visible' : ''}`}
    >
      {popular && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="absolute -top-2 right-3 text-neon text-xs font-bold px-3 py-1.5 font-mono tracking-widest rounded-sm"
          style={{ 
            backgroundColor: '#000000',
            textShadow: '0 0 10px rgba(0,255,157,0.8)',
            zIndex: 99999,
            position: 'absolute',
            boxShadow: '0 0 20px rgba(0,255,157,0.8)',
            border: '2px solid #00FF9D',
            background: '#000000',
            padding: '6px 12px'
          }}
        >
          MOST POPULAR
        </motion.div>
      )}
      
      <div className="w-full text-center">
        <h3 className="text-2xl font-black font-display text-white mb-2 tracking-widest">{title}</h3>
        <div className="text-5xl font-black text-white mb-1 font-display">{price}</div>
        <div className="text-xs font-mono text-gray-500 mb-8">PER MONTH</div>
      </div>

      <div className="w-full border-t border-white/10 py-6 space-y-3 flex-1">
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-300 mb-4">
          <Disc size={14} className={popular || free ? "text-neon" : "text-gray-500"} />
          <span className="font-bold">{clips}</span>
        </div>
        {features && features.map((feature: string, index: number) => (
          <div key={index} className="flex items-start gap-2 text-xs font-mono text-gray-400">
            <Check size={12} className={`mt-1 flex-shrink-0 ${popular || free ? "text-neon" : "text-gray-600"}`} />
            <span className="text-left">{feature}</span>
          </div>
        ))}
      </div>

      {free ? (
        <Link href="/upload" className="w-full">
          <button className="w-full py-3 font-bold font-display tracking-widest text-sm border-2 border-neon bg-neon/30 text-neon hover:bg-neon/50 rounded-sm transition-all">
            TRY FREE
          </button>
        </Link>
      ) : (
        <button className={`w-full py-3 font-bold font-display tracking-widest text-sm border-2 rounded-sm transition-all text-white ${
          popular 
            ? 'border-white/50 bg-white/15 hover:bg-white/25 hover:border-white/70' 
            : 'border-white/50 bg-white/15 hover:bg-white/25 hover:border-white/70'
        }`}>
          SELECT
        </button>
      )}
    </motion.div>
  );
}
