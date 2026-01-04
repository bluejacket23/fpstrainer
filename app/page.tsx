"use client";

import Link from "next/link";
import { 
  ArrowRight, Check, Crosshair, Shield, Zap, Target, Activity, Map, Brain, 
  Swords, Settings, Eye, BarChart3, Video, UserCheck, Cpu, Disc, Upload, FileText, Loader2
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

// Wrapper component for sections with scroll animations
function SectionWrapper({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'how-it-works', 'features', 'pricing', 'faq'];
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

        {/* LEFT SIDE HUD PANEL */}
        <div className="absolute left-4 lg:left-8 xl:left-16 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
          {/* Rotating Target Reticle */}
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-2 border-neon/30 rounded-full animate-spin-slow" />
            <div className="absolute inset-2 border border-neon/20 rounded-full animate-reverse-spin" />
            <div className="absolute inset-4 border border-dashed border-neon/40 rounded-full animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-neon animate-pulse" />
            </div>
            {/* Crosshair lines */}
            <div className="absolute top-0 left-1/2 w-px h-4 bg-gradient-to-b from-neon to-transparent" />
            <div className="absolute bottom-0 left-1/2 w-px h-4 bg-gradient-to-t from-neon to-transparent" />
            <div className="absolute left-0 top-1/2 h-px w-4 bg-gradient-to-r from-neon to-transparent" />
            <div className="absolute right-0 top-1/2 h-px w-4 bg-gradient-to-l from-neon to-transparent" />
          </div>

          {/* Data Panel */}
          <div className="w-48 bg-black/40 backdrop-blur-sm border border-neon/20 p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-neon/70">
              <span>SYS.STATUS</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-neon rounded-full animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="h-px bg-gradient-to-r from-neon/50 via-neon/20 to-transparent" />
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>CPU.LOAD</span>
                <span className="text-neon/80">87%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-neon/60 to-neon"
                  initial={{ width: "0%" }}
                  animate={{ width: "87%" }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>MEM.ALLOC</span>
                <span className="text-neon/80">64%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "64%" }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>AI.MODEL</span>
                <span className="text-neon/80">GPT-4o</span>
              </div>
            </div>
          </div>

          {/* Vertical Tech Line */}
          <div className="w-px h-32 mx-auto bg-gradient-to-b from-transparent via-neon/40 to-transparent relative">
            <motion.div 
              className="absolute w-1.5 h-1.5 bg-neon rounded-full -left-[2px]"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Mini Stats */}
          <div className="flex flex-col gap-1 font-mono text-[10px] text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-neon/40 rotate-45" />
              <span>LATENCY: <span className="text-neon/60">12ms</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-neon/40 rotate-45" />
              <span>FRAMES: <span className="text-neon/60">30 FPS</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-neon/40 rotate-45" />
              <span>ANALYSIS: <span className="text-neon/60">READY</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE HUD PANEL */}
        <div className="absolute right-4 lg:right-8 xl:right-16 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-end gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
          {/* Hexagon Grid Pattern */}
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Hexagon pattern */}
              <motion.polygon 
                points="50,5 90,25 90,75 50,95 10,75 10,25" 
                fill="none" 
                stroke="rgba(0,255,157,0.2)" 
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.polygon 
                points="50,15 80,30 80,70 50,85 20,70 20,30" 
                fill="none" 
                stroke="rgba(0,255,157,0.3)" 
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              <motion.polygon 
                points="50,25 70,35 70,65 50,75 30,65 30,35" 
                fill="none" 
                stroke="rgba(0,255,157,0.4)" 
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              />
              <motion.circle 
                cx="50" cy="50" r="8" 
                fill="rgba(0,255,157,0.1)" 
                stroke="rgba(0,255,157,0.6)"
                strokeWidth="1"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Corner markers */}
              <circle cx="50" cy="5" r="2" fill="#00ff9d" className="animate-pulse" />
              <circle cx="90" cy="25" r="2" fill="#00ff9d" opacity="0.5" />
              <circle cx="90" cy="75" r="2" fill="#00ff9d" opacity="0.5" />
              <circle cx="50" cy="95" r="2" fill="#00ff9d" className="animate-pulse" />
              <circle cx="10" cy="75" r="2" fill="#00ff9d" opacity="0.5" />
              <circle cx="10" cy="25" r="2" fill="#00ff9d" opacity="0.5" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-neon text-lg font-bold">AI</span>
            </div>
          </div>

          {/* Performance Metrics Panel */}
          <div className="w-52 bg-black/40 backdrop-blur-sm border border-neon/20 p-3 font-mono text-xs">
            <div className="flex items-center justify-between text-neon/70 mb-2">
              <span>METRICS.PREVIEW</span>
              <Activity className="w-3 h-3" />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-neon/20 to-neon/50 mb-3" />
            
            {/* Mini radar chart representation */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-500">
              <div className="flex items-center justify-between">
                <span>AIM</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-3 ${i <= 4 ? 'bg-neon/70' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>MOVE</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-3 ${i <= 3 ? 'bg-cyan-400/70' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>POS</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-3 ${i <= 4 ? 'bg-purple-400/70' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>IQ</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-3 ${i <= 5 ? 'bg-yellow-400/70' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Waveform */}
          <div className="w-48 h-12 flex items-end justify-center gap-0.5">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-neon/30 to-neon/80 rounded-full"
                animate={{ 
                  height: [
                    `${20 + Math.sin(i * 0.5) * 15}px`,
                    `${35 + Math.cos(i * 0.5) * 20}px`,
                    `${20 + Math.sin(i * 0.5) * 15}px`
                  ]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.05,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Connection Status */}
          <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-gray-600">
            <div className="flex items-center gap-2">
              <span>NEURAL.LINK</span>
              <span className="text-neon/60">ACTIVE</span>
              <div className="w-2 h-2 bg-neon/60 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <span>VISION.AI</span>
              <span className="text-neon/60">READY</span>
              <div className="w-2 h-2 bg-neon/40 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <span>ANALYSIS.ENG</span>
              <span className="text-neon/60">STANDBY</span>
              <div className="w-2 h-2 bg-yellow-500/60 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

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
            
            <div className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-mono text-left h-32 overflow-hidden relative mask-fade">
              <div className="absolute top-0 left-0 right-0 flex flex-col space-y-2 animate-scroll-up">
                {/* First set - will loop seamlessly */}
                <div className="font-normal">&gt; ANALYZING GAMEPLAY...</div>
                <div className="font-normal">&gt; EXTRACTING FRAMES FROM VIDEO...</div>
                <div className="font-normal">&gt; PROCESSING VISUAL DATA...</div>
                <div className="font-normal">&gt; CALCULATING AIM ACCURACY METRICS...</div>
                <div className="font-normal">&gt; EVALUATING MOVEMENT PATTERNS...</div>
                <div className="font-normal">&gt; ASSESSING POSITIONING STRATEGY...</div>
                <div className="font-normal">&gt; ANALYZING ENGAGEMENT QUALITY...</div>
                <div className="font-normal">&gt; SCANNING FOR IMPROVEMENT OPPORTUNITIES...</div>
                <div className="font-normal">&gt; PROCESSING ADVANCED METRICS...</div>
                <div className="font-normal">&gt; GENERATING COACHING INSIGHTS...</div>
                <div className="font-normal">&gt; COMPILING PERFORMANCE SCORECARD...</div>
                <div className="font-normal">&gt; IDENTIFYING KEY MOMENTS...</div>
                <div className="font-normal">&gt; EVALUATING GAME SENSE...</div>
                <div className="font-normal">&gt; ANALYZING WEAPON HANDLING...</div>
                <div className="font-normal">&gt; ASSESSING SURVIVABILITY FACTORS...</div>
                <div className="font-normal">&gt; PROCESSING TACTICAL DECISIONS...</div>
                <div className="font-normal">&gt; CALCULATING PREDICTABILITY SCORE...</div>
                <div className="font-normal">&gt; EVALUATING MECHANICAL CONSISTENCY...</div>
                <div className="font-normal">&gt; GENERATING PERSONALIZED FEEDBACK...</div>
                <div className="font-normal">&gt; FINALIZING ANALYSIS REPORT...</div>
                <div className="font-normal">&gt; COMPUTING CROSSHAIR PLACEMENT ACCURACY...</div>
                <div className="font-normal">&gt; ANALYZING RECOIL CONTROL PATTERNS...</div>
                <div className="font-normal">&gt; EVALUATING FIRST-SHOT HIT RATE...</div>
                <div className="font-normal">&gt; PROCESSING STRAFING MECHANICS...</div>
                <div className="font-normal">&gt; CALCULATING ROTATION EFFICIENCY...</div>
                <div className="font-normal">&gt; ASSESSING COVER UTILIZATION...</div>
                <div className="font-normal">&gt; ANALYZING PEEKING TECHNIQUES...</div>
                <div className="font-normal">&gt; EVALUATING LANE PRESSURE METRICS...</div>
                <div className="font-normal">&gt; PROCESSING TEMPO RATING ANALYSIS...</div>
                <div className="font-normal">&gt; CALCULATING ENGAGEMENT WIN RATE...</div>
                <div className="font-normal">&gt; ASSESSING DISENGAGEMENT TIMING...</div>
                <div className="font-normal">&gt; ANALYZING WEAPON SWAP EFFICIENCY...</div>
                <div className="font-normal">&gt; EVALUATING RELOAD TIMING OPTIMIZATION...</div>
                {/* Duplicate set for seamless loop */}
                <div className="font-normal">&gt; ANALYZING GAMEPLAY...</div>
                <div className="font-normal">&gt; EXTRACTING FRAMES FROM VIDEO...</div>
                <div className="font-normal">&gt; PROCESSING VISUAL DATA...</div>
                <div className="font-normal">&gt; CALCULATING AIM ACCURACY METRICS...</div>
                <div className="font-normal">&gt; EVALUATING MOVEMENT PATTERNS...</div>
                <div className="font-normal">&gt; ASSESSING POSITIONING STRATEGY...</div>
                <div className="font-normal">&gt; ANALYZING ENGAGEMENT QUALITY...</div>
                <div className="font-normal">&gt; SCANNING FOR IMPROVEMENT OPPORTUNITIES...</div>
                <div className="font-normal">&gt; PROCESSING ADVANCED METRICS...</div>
                <div className="font-normal">&gt; GENERATING COACHING INSIGHTS...</div>
                <div className="font-normal">&gt; COMPILING PERFORMANCE SCORECARD...</div>
                <div className="font-normal">&gt; IDENTIFYING KEY MOMENTS...</div>
                <div className="font-normal">&gt; EVALUATING GAME SENSE...</div>
                <div className="font-normal">&gt; ANALYZING WEAPON HANDLING...</div>
                <div className="font-normal">&gt; ASSESSING SURVIVABILITY FACTORS...</div>
                <div className="font-normal">&gt; PROCESSING TACTICAL DECISIONS...</div>
                <div className="font-normal">&gt; CALCULATING PREDICTABILITY SCORE...</div>
                <div className="font-normal">&gt; EVALUATING MECHANICAL CONSISTENCY...</div>
                <div className="font-normal">&gt; GENERATING PERSONALIZED FEEDBACK...</div>
                <div className="font-normal">&gt; FINALIZING ANALYSIS REPORT...</div>
                <div className="font-normal">&gt; COMPUTING CROSSHAIR PLACEMENT ACCURACY...</div>
                <div className="font-normal">&gt; ANALYZING RECOIL CONTROL PATTERNS...</div>
                <div className="font-normal">&gt; EVALUATING FIRST-SHOT HIT RATE...</div>
                <div className="font-normal">&gt; PROCESSING STRAFING MECHANICS...</div>
                <div className="font-normal">&gt; CALCULATING ROTATION EFFICIENCY...</div>
                <div className="font-normal">&gt; ASSESSING COVER UTILIZATION...</div>
                <div className="font-normal">&gt; ANALYZING PEEKING TECHNIQUES...</div>
                <div className="font-normal">&gt; EVALUATING LANE PRESSURE METRICS...</div>
                <div className="font-normal">&gt; PROCESSING TEMPO RATING ANALYSIS...</div>
                <div className="font-normal">&gt; CALCULATING ENGAGEMENT WIN RATE...</div>
                <div className="font-normal">&gt; ASSESSING DISENGAGEMENT TIMING...</div>
                <div className="font-normal">&gt; ANALYZING WEAPON SWAP EFFICIENCY...</div>
                <div className="font-normal">&gt; EVALUATING RELOAD TIMING OPTIMIZATION...</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/upload">
                <button className="relative group px-10 py-5 font-bold text-xl transition-all duration-200 hover:scale-105 border-2 border-neon bg-neon/10 text-neon hover:bg-neon/20 hover:border-neon/80 font-display tracking-widest">
                  <span className="relative z-10 flex items-center gap-2">
                    INITIATE ANALYSIS <ArrowRight size={20} />
                  </span>
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <SectionWrapper id="how-it-works" className="py-32 relative bg-surface/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">How It Works</h2>
            <p className="text-gray-400 font-mono text-sm">AI-POWERED GAMEPLAY ANALYSIS FOR CALL OF DUTY, BATTLEFIELD, APEX LEGENDS, COUNTER-STRIKE, VALORANT & MORE</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            <HowItWorksStep
              number="01"
              icon={<Upload className="w-12 h-12" />}
              title="Upload Clip"
              description="Upload your gameplay clip (up to 60 seconds, max 100MB). Our system supports all major FPS games including Call of Duty, Battlefield, Apex Legends, Counter-Strike, and Valorant. Fast, secure uploads with automatic processing."
            />
            <HowItWorksStep
              number="02"
              icon={<Brain className="w-12 h-12" />}
              title="AI Analysis"
              description="Advanced AI analyzes every frame of your gameplay, evaluating aim precision, positioning, movement mechanics, game sense, and decision-making. Our advanced LLM powered system provides professional-level coaching insights with 60+ detailed metrics."
            />
            <HowItWorksStep
              number="03"
              icon={<FileText className="w-12 h-12" />}
              title="Get Scoring & Feedback"
              description="Receive detailed scoring across 20+ metrics, personalized coaching feedback, key moments breakdown with timestamps, and actionable training recommendations. Track your progress over time with cumulative statistics."
            />
          </motion.div>
          
          <div className="mt-16 bg-surface/30 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">What You Get</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Comprehensive Scorecard</h4>
                    <p className="text-sm text-gray-400">60+ metrics including aim accuracy, movement mechanics, positioning, game sense, engagement quality, and more.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Key Moments Breakdown</h4>
                    <p className="text-sm text-gray-400">Timestamped analysis of critical plays, mistakes, and opportunities with specific recommendations.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Personalized Coaching</h4>
                    <p className="text-sm text-gray-400">Tailored feedback with top habits to fix, easy wins, and weekly improvement plans.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Training Drills</h4>
                    <p className="text-sm text-gray-400">Step-by-step training exercises designed to improve your specific weaknesses.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Progress Tracking</h4>
                    <p className="text-sm text-gray-400">Monitor your improvement over time with cumulative statistics and tier rankings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-neon mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white mb-1">Advanced Metrics</h4>
                    <p className="text-sm text-gray-400">Lane pressure, tempo rating, predictability score, mechanical consistency, and confidence rating.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 10-DIMENSION ANALYSIS GRID */}
      <SectionWrapper id="features" className="py-32 relative bg-surface border-t border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20 flex items-end justify-between border-b border-white/10 pb-6"
          >
            <div>
              <h2 className="text-5xl font-black font-display text-white mb-2">SYSTEM MODULES</h2>
              <p className="text-cyber font-mono text-sm tracking-widest">/// COMPREHENSIVE GAMEPLAY DECONSTRUCTION</p>
            </div>
            <Cpu className="text-white/20 w-16 h-16" />
          </motion.div>

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
      </SectionWrapper>

      {/* PRICING SECTION */}
      <SectionWrapper id="pricing" className="py-32 relative overflow-hidden bg-void">
        {/* Gradient Orb */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-electric/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">Select Tier</h2>
            <p className="text-gray-400 font-mono text-sm">UNLOCK ADVANCED TACTICAL DATA</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <PricingCard 
              title="RECRUIT" 
              price="$0" 
              clips="1 Clip/Month"
              planKey="RECRUIT"
              features={[
                "No card required",
                "Basic AI analysis",
                "60+ metric scorecard",
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
              planKey="ROOKIE"
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
              planKey="COMPETITIVE"
              features={[
                "Advanced Statistical analysis",
                "Personalized drills",
                "Timeline-based breakdowns",
                "Engagement quality metrics",
                "Positioning heatmaps",
                "Movement mechanics scoring"
              ]}
              color="border-cyber"
            />
            <PricingCard 
              title="ELITE" 
              price="$15" 
              clips="50 Clips/Month"
              planKey="ELITE"
              features={[
                "Everything in Competitive +",
                "Personalized 8-Week Training Program",
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
              planKey="PRO"
              features={[
                "Everything in Elite +",
                "Personalized 8-Week Training Program",
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
              planKey="GOD"
              features={[
                "Everything in Pro +",
                "Personalized 8-Week Training Program",
                "Our most advanced LLM",
                "Personalized Reports",
                "Exclusive customization requests",
                "Advanced comparison analytics",
              ]}
              color="border-yellow-500"
              glow="shadow-[0_0_40px_rgba(255,215,0,0.3)]"
            />
          </motion.div>
        </div>
      </SectionWrapper>

      {/* FAQ SECTION */}
      <SectionWrapper id="faq" className="py-32 relative bg-surface/30 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">FAQ</h2>
            <p className="text-gray-400 font-mono text-sm">FREQUENTLY ASKED QUESTIONS</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <FAQItem 
              question="What games does FPSTrainer support?"
              answer="FPSTrainer works with all major tactical FPS games including Call of Duty (Warzone, Modern Warfare, Black Ops), Battlefield, Apex Legends, Counter-Strike 2, Valorant, Rainbow Six Siege, and more. As long as you can record gameplay footage, we can analyze it."
            />
            <FAQItem 
              question="How long does the analysis take?"
              answer="Typically 1-2 minutes after upload. The AI processes your clip frame-by-frame, extracts key moments, and generates a comprehensive report with 20+ metrics. You'll be redirected to your report page automatically once processing begins."
            />
            <FAQItem 
              question="What video format and length do you accept?"
              answer="We accept MP4 video files up to 60 seconds in length and 100MB in size. The video should be clear enough to see gameplay details. Most screen recording software (OBS, NVIDIA ShadowPlay, Xbox Game Bar) works perfectly."
            />
            <FAQItem 
              question="How accurate is the AI analysis?"
              answer="Our AI uses advanced LLMs with vision capabilities to analyze gameplay at a professional coaching level. It evaluates aim precision, movement mechanics, positioning, game sense, and decision-making. Scores are based on professional standards - excellent players typically score 85-95, good competitive players score 75-84."
            />
            <FAQItem 
              question="Can I track my progress over time?"
              answer="Yes! Your dashboard shows cumulative statistics across all your reports, including average scores, high scores, and tier rankings. You can see how you're improving across different metrics over time."
            />
            <FAQItem 
              question="How do clips per month work?"
              answer="Each plan includes a monthly clip allowance. Clips reset every 30 days from your first upload, creating a rolling window. For example, if you upload your first clip on January 15th, your clips reset on February 14th. Unused clips do not carry over. You can upgrade your plan at any time to get more clips."
            />
            <FAQItem 
              question="What is the 8-Week Training Program?"
              answer="Available for Elite plan and above, this feature generates a personalized 8-week training program based on your gameplay analysis. It includes a structured improvement plan tailored to your specific weaknesses."
            />
            <FAQItem 
              question="Can I share my reports?"
              answer="Yes! Each report includes a shareable graphic button that creates a styled image with all your scores. Perfect for sharing on social media or with teammates. The graphic includes FPSTrainer branding."
            />
            <FAQItem 
              question="How do I cancel my subscription?"
              answer="You can cancel your subscription at any time from your Account page. Cancellation stops automatic renewals but you retain access until the end of your current billing period. After cancellation, you'll be moved to the free RECRUIT plan."
            />
            <FAQItem 
              question="Is my data secure?"
              answer="Yes. We use AWS Amplify with industry-standard security practices. Your videos are processed securely and deleted after analysis. Only you can access your reports. We never share your data with third parties."
            />
            <FAQItem 
              question="What if I'm not satisfied with my analysis?"
              answer="We're constantly improving our AI analysis. If you have feedback or concerns about a specific report, please contact us at fpstrainer.help@gmail.com. We take quality seriously and want to ensure you get valuable insights."
            />
          </motion.div>
        </div>
      </SectionWrapper>
      
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
            <span>|</span>
            <a href="mailto:fpstrainer.help@gmail.com" className="hover:text-neon transition-colors">Contact Us</a>
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

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-surface/50 border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface/30 transition-colors"
      >
        <span className="font-bold text-white font-mono text-sm">{question}</span>
        <span className={`text-neon transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ArrowRight size={20} className="transform -rotate-90" />
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-400 font-mono text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
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

function PricingCard({ title, price, clips, features, color, glow, popular, free, planKey }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get auth state - user will be undefined if not logged in
  const { user } = useAuthenticator((context) => [context.user]);

  const handleSelectPlan = async () => {
    // For free plan, just redirect to upload
    if (free) {
      window.location.href = '/upload';
      return;
    }
    
    // If not logged in, redirect to login first
    if (!user) {
      // Save the intended plan to localStorage so we can redirect after login
      localStorage.setItem('pendingPlan', planKey);
      window.location.href = '/login?redirect=/account';
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.mutations.createCheckoutSession({
        planName: planKey,
      });
      
      // Handle both direct object and stringified JSON response
      let data = result.data as any;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse response:', data);
        }
      }
      
      console.log('Checkout response:', data);
      
      if (data?.success && data?.url) {
        // Redirect to Stripe checkout or portal
        window.location.href = data.url;
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
            <span className={`text-left ${feature.includes('8-Week Training Program') || feature.includes('Personalized 8-Week') ? 'font-bold text-neon' : ''}`}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="w-full mb-2 text-xs text-red-400 text-center font-mono">
          {error}
        </div>
      )}

      <button 
        onClick={handleSelectPlan}
        disabled={loading}
        className={`w-full py-3 font-bold font-display tracking-widest text-sm border-2 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          free 
            ? 'border-neon bg-neon/30 text-neon hover:bg-neon/50' 
            : popular
              ? 'border-white/50 bg-white/15 text-white hover:bg-white/25 hover:border-white/70'
              : 'border-white/50 bg-white/15 text-white hover:bg-white/25 hover:border-white/70'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            PROCESSING...
          </span>
        ) : free ? (
          "TRY FREE"
        ) : (
          "SELECT"
        )}
      </button>
    </motion.div>
  );
}
