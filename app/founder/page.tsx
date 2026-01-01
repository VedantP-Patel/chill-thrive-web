"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, useScroll, useTransform, Variants } from "framer-motion"; // <--- 1. Import Variants
import Image from "next/image";

// --- ANIMATION CONFIG ---
// 2. Add ': Variants' to explicitly type these objects
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1] // TypeScript now accepts this as a Bezier Tuple
    } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

export default function FounderPage() {
  // ... rest of the code remains exactly the same ...
  const [profile, setProfile] = useState<any>(null);
  
  // FIXED: Track Window Scroll (No Ref needed) prevents hydration errors
  const { scrollYProgress } = useScroll(); 
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from("founder_profile").select("*").single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  // --- LOADING STATE ---
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Asset...</p>
       </div>
    </div>
  );

  // --- DATA ADAPTERS ---
  const storyParagraphs = profile.story ? profile.story.split('\n').filter((p: string) => p.trim() !== "") : [];
  
  const values = [
    { title: profile.value_1_title, desc: profile.value_1_desc, icon: "🧬" },
    { title: profile.value_2_title, desc: profile.value_2_desc, icon: "💎" },
    { title: "Community", desc: "Building a tribe of high-performers.", icon: "🤝" }
  ].filter(v => v.title);

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative selection:bg-blue-200 selection:text-blue-900">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] bg-blue-200/30 rounded-full blur-[120px] animate-pulse-slow mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[100px] animate-pulse-slow [animation-delay:2s] mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* --- SECTION 1: HERO QUOTE & PHOTO --- */}
      <section className="relative min-h-[90vh] flex items-center pt-32 pb-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Quote Text */}
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="lg:col-span-7 relative z-10 order-2 lg:order-1"
          >
            <motion.div variants={fadeInUp} className="inline-block mb-8">
               <span className="px-4 py-2 rounded-full bg-white/80 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-blue-100 shadow-sm">
                 The Origin Story
               </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="mb-8">
              <span className="block text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                "{profile.quote}"
              </span>
            </motion.h1>

            <motion.div variants={fadeInUp} className="flex items-center gap-5">
              <div className="h-px w-16 bg-gradient-to-r from-blue-600 to-transparent"></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{profile.name}</h3>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 text-xs font-bold uppercase tracking-widest">{profile.role}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Parallax Photo */}
          <div className="lg:col-span-5 relative h-[50vh] lg:h-[70vh] order-1 lg:order-2 group perspective-1000">
             <motion.div 
               style={{ y: yParallax, opacity: opacityFade }} 
               className="absolute inset-0 z-20 rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-white outline outline-1 outline-slate-200 rotate-y-6 group-hover:rotate-y-0 transition-all duration-700 ease-out"
             >
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent mix-blend-overlay z-10 pointer-events-none"></div>
                
                <Image 
                  src={profile.image_url || "https://placehold.co/800x1200"} 
                  alt={profile.name}
                  fill
                  className="object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                  priority
                  unoptimized
                />
             </motion.div>
             {/* Glow Element */}
             <div className="absolute top-10 left-10 inset-0 bg-blue-400/20 blur-[60px] -z-10 rounded-[3rem]"></div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 text-2xl animate-bounce"
        >
          ↓
        </motion.div>
      </section>

      {/* --- SECTION 2: THE STORY (Glassmorphism) --- */}
      <section className="relative py-32 px-6 md:px-12 lg:px-24 z-10">
        <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] shadow-xl border border-white/50">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-center text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-12">
              FROM BROKEN TO <span className="text-blue-600">BREAKTHROUGH.</span>
            </motion.h2>

            <div className="space-y-8">
              {storyParagraphs.map((paragraph: string, index: number) => (
                <motion.p key={index} variants={fadeInUp} className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.div variants={fadeInUp} className="mt-16 flex justify-center">
               <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 3: MISSION & VALUES --- */}
      <section className="relative py-32 px-6 md:px-12 lg:px-24 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
             initial={{ opacity: 0, y: 40 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-20"
          >
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Our DNA</h2>
             <h3 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase">Mission & Protocol</h3>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Mission Card (Wide) */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group text-white shadow-2xl"
            >
               <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px] group-hover:bg-blue-500/40 transition-colors duration-700"></div>
               <div className="relative z-10">
                  <span className="text-6xl mb-6 block">🚀</span>
                  <h3 className="text-3xl font-black uppercase mb-6 tracking-tight">The Mission</h3>
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium">
                    {profile.mission}
                  </p>
               </div>
            </motion.div>

            {/* Values Column */}
            <div className="flex flex-col gap-8">
               {values.map((val, idx) => (
                 <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 50 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 0.8, delay: idx * 0.2 }}
                    className="flex-1 bg-white p-10 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group"
                 >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <span className="text-4xl mb-4 block">{val.icon}</span>
                        <h4 className="text-xl font-black text-slate-900 uppercase mb-2">{val.title}</h4>
                        <p className="text-slate-500 text-sm font-bold leading-relaxed">{val.desc}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

          </div>
        </div>
      </section>

      {/* --- CSS FOR CUSTOM ANIMATIONS --- */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-6 {
          transform: rotateY(-6deg);
        }
        .group:hover .rotate-y-0 {
          transform: rotateY(0deg);
        }
      `}</style>
    </div>
  );
}