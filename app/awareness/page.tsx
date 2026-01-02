"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, Variants } from "framer-motion"; // <--- Added Variants import
import { 
  ThermometerSnowflake, Brain, HeartPulse, ShieldAlert, 
  Flame, CheckCircle2, XCircle, Activity, BookOpen 
} from "lucide-react";

// --- ANIMATION VARIANTS (Typed explicitly) ---
const containerVar: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const sectionVar: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 50 } 
  }
};

export default function AwarenessPage() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // --- FETCH CONTENT ---
  useEffect(() => {
    const fetchContent = async () => {
      // Try to fetch from DB
      const { data } = await supabase.from("awareness_content").select("*");
      
      const contentMap: any = {};
      
      // If DB has data, map it. Otherwise use Fallbacks.
      if (data && data.length > 0) {
        data.forEach((item: any) => {
            contentMap[item.section_key] = item;
        });
      }
      
      setContent(contentMap);
      setLoading(false);
    };
    fetchContent();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pt-32 pb-20 overflow-x-hidden">
      
      {/* 🌌 HERO SECTION */}
      <section className="relative px-6 mb-24">
        <div className="max-w-7xl mx-auto text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                    <BookOpen size={12} /> Education Hub
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 mb-6">
                    RECOVERY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">SCIENCE</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
                    Understand the mechanics of human performance. We combine ancient wisdom with modern physiological science to optimize your biology.
                </p>
            </motion.div>
        </div>
      </section>

      {/* 🧠 SECTION 1: WHAT IS COLD THERAPY? */}
      <motion.section 
        variants={containerVar} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 mb-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={sectionVar}>
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-4">The Methodology</h2>
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                    Controlled <br/>Cold Exposure.
                </h3>
                <div className="prose prose-lg text-slate-600 leading-relaxed">
                    <p>
                        {content['intro']?.content || 
                        "Cold Water Immersion (CWI) is more than just a test of will. It is a calculated physiological stressor that triggers a cascade of hormonal and vascular responses. By exposing the body to temperatures between 10°C and 15°C, we initiate the 'Fight or Flight' response in a controlled environment, training your nervous system to remain calm under pressure."}
                    </p>
                </div>
            </motion.div>
            <motion.div variants={sectionVar} className="relative">
                <div className="absolute inset-0 bg-blue-600/5 rounded-[2.5rem] rotate-3"></div>
                <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <ThermometerSnowflake size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Therapeutic Range</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">10°C — 15°C</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {["Vasoconstriction", "Metabolic Boost", "Immune System Activation"].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <CheckCircle2 size={18} className="text-blue-500" />
                                <span className="font-bold text-slate-700 text-sm uppercase">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
      </motion.section>

      {/* 🧬 SECTION 2: THE SCIENCE (CARDS) */}
      <section className="bg-slate-900 py-24 mb-32 relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em] mb-4">Physiological Impact</h2>
                <h3 className="text-4xl font-black text-white">Why It Works</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-colors"
                >
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/30">
                        <Brain size={24} />
                    </div>
                    <h4 className="text-xl font-black text-white mb-3">Dopamine Spike</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Cold exposure can increase dopamine levels by up to 250%. This creates a sustained mood boost and improved focus that lasts for hours after the session.
                    </p>
                </motion.div>

                {/* Card 2 */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-colors"
                >
                    <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-500/30">
                        <HeartPulse size={24} />
                    </div>
                    <h4 className="text-xl font-black text-white mb-3">Vascular Health</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        The cycle of constriction (cold) and dilation (rewarming) acts as a pump for your lymphatic system, flushing out metabolic waste and reducing inflammation.
                    </p>
                </motion.div>

                {/* Card 3 */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-colors"
                >
                    <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/30">
                        <Activity size={24} />
                    </div>
                    <h4 className="text-xl font-black text-white mb-3">Recovery Speed</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Drastically reduces Delayed Onset Muscle Soreness (DOMS) by lowering tissue temperature and reducing the metabolic rate of damaged tissue.
                    </p>
                </motion.div>
            </div>
        </div>
      </section>

      {/* 🔥❄️ SECTION 3: HEAT VS COLD */}
      <motion.section 
        variants={containerVar} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="max-w-6xl mx-auto px-6 mb-32"
      >
        <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-4">Comparative Analysis</h2>
            <h3 className="text-4xl font-black text-slate-900">Heat vs. Cold Therapy</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* HEAT */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                <div className="flex items-center gap-4 mb-6">
                    <span className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Flame size={24}/></span>
                    <h4 className="text-2xl font-black text-slate-900">Heat Therapy</h4>
                </div>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-orange-500 mt-1">●</span> Promotes blood flow & muscle relaxation.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-orange-500 mt-1">●</span> Best for stiffness and chronic pain.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-orange-500 mt-1">●</span> Increases tissue elasticity.
                    </li>
                </ul>
            </div>

            {/* COLD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                <div className="flex items-center gap-4 mb-6">
                    <span className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ThermometerSnowflake size={24}/></span>
                    <h4 className="text-2xl font-black text-slate-900">Cold Therapy</h4>
                </div>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-blue-500 mt-1">●</span> Reduces inflammation & numbs pain.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-blue-500 mt-1">●</span> Best for acute injuries and recovery.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-blue-500 mt-1">●</span> Improves mental resilience.
                    </li>
                </ul>
            </div>
        </div>
      </motion.section>

      {/* 🤥✅ SECTION 4: MYTHS vs FACTS */}
      <section className="max-w-4xl mx-auto px-6 mb-32">
        <div className="text-center mb-12">
             <h3 className="text-3xl font-black text-slate-900">Common Myths</h3>
        </div>
        <div className="space-y-4">
            {[
                { m: "Colder is always better.", f: "False. The therapeutic window is 10-15°C. Going near freezing increases risk without significant added benefit." },
                { m: "You should stay in as long as possible.", f: "False. 2-5 minutes is the optimal duration for physiological benefits. More is not better." },
                { m: "It's just a placebo.", f: "False. Cold exposure triggers measurable hormonal and vascular changes, including norepinephrine release." }
            ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest mb-1">
                            <XCircle size={14}/> Myth
                        </div>
                        <p className="font-bold text-slate-900 text-lg">{item.m}</p>
                    </div>
                    <div className="hidden md:block w-px h-12 bg-slate-100"></div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-green-600 font-bold uppercase text-xs tracking-widest mb-1">
                            <CheckCircle2 size={14}/> Fact
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{item.f}</p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* ⚠️ SECTION 5: MEDICAL DISCLAIMER */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="bg-amber-50 border border-amber-100 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <ShieldAlert size={200} className="text-amber-900" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert className="text-amber-600" size={32} />
                    <h2 className="text-2xl font-black text-amber-900 uppercase">Medical Disclaimer</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 text-amber-900/80 font-medium leading-relaxed">
                    <p>
                        Cold Water Immersion places a significant stress on the cardiovascular system. It is <strong>NOT</strong> recommended for individuals with:
                    </p>
                    <ul className="space-y-2 list-disc list-inside">
                        <li>High blood pressure (Hypertension)</li>
                        <li>Heart disease or Angina</li>
                        <li>Raynaud’s Disease</li>
                        <li>Pregnancy</li>
                        <li>History of seizures or epilepsy</li>
                    </ul>
                </div>
                <p className="mt-8 text-xs text-amber-800 font-bold uppercase tracking-widest border-t border-amber-200 pt-6">
                    * Always consult a physician before beginning any new recovery protocol.
                </p>
            </div>
        </div>
      </section>

    </main>
  );
}