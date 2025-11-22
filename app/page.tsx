"use client";

import Link from "next/link";
import { 
  ArrowRight, Check, Crosshair, Shield, Zap, Target, Activity, Map, Brain, 
  Swords, Settings, Eye, BarChart3, Video, UserCheck, Cpu, Disc
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  // We will skip using the targetRef for scroll progress for now to fix the hydration issue
  // or simply wrap the scroll logic in a way that ensures it runs on client only safely.
  // For now, let's simplify animations to avoid the specific 'target ref not hydrated' error
  // by removing the useScroll hook usage on the ref directly in this render pass or checking mount.
  
  // However, the error "Target ref is defined but not hydrated" usually means the ref
  // was passed to useScroll but the element wasn't rendered or the ref wasn't attached
  // by the time the hook ran.
  
  // Let's just remove the scroll-linked parallax for the HUD for stability
  // and keep the entrance animations.
  
  return (
    <main className="flex flex-col min-h-screen bg-background text-white overflow-x-hidden selection:bg-cyber selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
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
              
              <Link href="#demo">
                <button className="cyber-button px-10 py-5 font-bold text-xl border border-white/20 hover:border-cyber hover:text-cyber hover:bg-cyber/10 transition-all font-display tracking-widest">
                  VIEW DEMO
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs"
        >
          SCROLL TO DECRYPT
        </motion.div>
      </section>

      {/* 10-DIMENSION ANALYSIS GRID */}
      <section className="py-32 relative bg-surface border-t border-white/5">
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

      {/* BATTLE PASS PRICING */}
      <section id="pricing" className="py-32 relative overflow-hidden bg-void">
        {/* Gradient Orb */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-electric/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black font-display text-white mb-4 uppercase">Select Tier</h2>
            <p className="text-gray-400 font-mono text-sm">UNLOCK ADVANCED TACTICAL DATA</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <PricingCard 
              title="ROOKIE" 
              price="$0" 
              clips="1 Clip" 
              color="border-gray-700"
            />
            <PricingCard 
              title="GRINDER" 
              price="$9" 
              clips="20 Clips" 
              color="border-neon"
              glow="shadow-[0_0_30px_rgba(0,255,157,0.2)]"
              popular
            />
            <PricingCard 
              title="COMPETITIVE" 
              price="$15" 
              clips="50 Clips" 
              color="border-cyber"
            />
            <PricingCard 
              title="PRO" 
              price="$29" 
              clips="150 Clips" 
              color="border-electric"
            />
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="py-8 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="font-display font-bold text-2xl tracking-widest">
            FPS<span className="text-neon">TRAINER</span>
          </div>
          <div className="font-mono text-xs text-gray-600">
            SYSTEM STATUS: ONLINE
          </div>
        </div>
      </footer>
    </main>
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

function PricingCard({ title, price, clips, color, glow, popular }: any) {
  return (
    <div className={`relative p-8 border ${color} bg-surface/50 flex flex-col items-center justify-between min-h-[400px] transition-all hover:-translate-y-2 hover:bg-surface ${glow}`}>
      {popular && (
        <div className="absolute top-0 inset-x-0 bg-neon text-black text-xs font-bold text-center py-1 font-mono tracking-widest">
          MOST POPULAR
        </div>
      )}
      
      <div className="w-full text-center">
        <h3 className="text-2xl font-black font-display text-white mb-2 tracking-widest">{title}</h3>
        <div className="text-5xl font-black text-white mb-1 font-display">{price}</div>
        <div className="text-xs font-mono text-gray-500 mb-8">PER MONTH</div>
      </div>

      <div className="w-full border-t border-white/10 py-8 space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-300">
          <Disc size={14} className={popular ? "text-neon" : "text-gray-500"} />
          {clips}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-300">
          <Disc size={14} className={popular ? "text-neon" : "text-gray-500"} />
          AI Analysis
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-300">
          <Disc size={14} className={popular ? "text-neon" : "text-gray-500"} />
          Rank Tracking
        </div>
      </div>

      <button className={`w-full py-3 font-bold font-display tracking-widest text-sm border ${popular ? 'bg-neon text-black border-neon' : 'border-white/20 text-white hover:bg-white hover:text-black'} transition-all`}>
        SELECT
      </button>
    </div>
  );
}
