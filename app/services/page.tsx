"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion, Variants } from "framer-motion"; // <--- Added Variants import
import { ArrowRight, Sparkles, Zap, Activity, Star, Clock } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1544367563-12123d896889?q=80&w=1000";

// --- ANIMATION VARIANTS (Typed explicitly) ---
const containerVar: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVar: Variants = {
  hidden: { y: 40, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 50, damping: 20 } 
  }
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("price");
      
      if (data) {
          // 🧠 SMART PROCESSING
          const processed = data.map(item => {
              let minPrice = item.price;
              let displayDuration = item.duration;
              let hasVariants = false;

              // Logic: Find the CHEAPEST variant and use ITS duration
              if (item.variants) {
                  let vars = [];
                  try {
                      vars = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
                  } catch(e) {}

                  if (Array.isArray(vars) && vars.length > 0) {
                      // Sort by price (Lowest first)
                      vars.sort((a:any, b:any) => Number(a.price) - Number(b.price));
                      
                      minPrice = vars[0].price;          // Price of cheapest option
                      displayDuration = vars[0].duration; // Duration of cheapest option
                      hasVariants = vars.length > 1;
                  }
              }

              return { ...item, minPrice, displayDuration, hasVariants };
          });
          setServices(processed);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 🌌 HEADER SECTION */}
      <div className="relative bg-slate-900 pt-32 pb-32 px-6 overflow-hidden">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
         
         <div className="relative z-10 max-w-7xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                    <Activity size={12} className="animate-pulse" /> Systems Online
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6">
                    RECOVERY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">MENU</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    Select your therapy module. Advanced sessions designed for acute inflammation control and cognitive restoration.
                </p>
            </motion.div>
         </div>

         <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
             <svg className="relative block w-full h-[50px] fill-slate-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
                 <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
             </svg>
         </div>
      </div>

      {/* 🏳️ MAIN CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 -mt-10 pb-20">
        
        <motion.div 
            variants={containerVar}
            initial="hidden"
            animate="show"
            className="space-y-16"
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32">
                 <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                 <p className="text-slate-400 font-mono text-xs font-bold tracking-widest">LOADING MODULES...</p>
             </div>
          ) : services.length > 0 ? (
             services.map((s, index) => (
              <motion.div 
                key={s.id} 
                variants={cardVar}
                whileHover={{ y: -5 }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/60 hover:shadow-blue-200/50 border border-slate-100 transition-all duration-500 group`}
              >
                  
                  {/* IMAGE SIDE */}
                  <div className="w-full lg:w-1/2 h-72 lg:h-auto relative overflow-hidden">
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                      <img 
                          src={s.image_url || FALLBACK_IMG} 
                          alt={s.title} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" 
                          onError={(e) => (e.target as HTMLImageElement).src = FALLBACK_IMG}
                      />
                      
                      <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur text-slate-900 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest shadow-lg">
                          0{index + 1}
                      </div>

                      {s.type === 'combo' && (
                          <div className="absolute bottom-6 left-6 z-20 bg-black text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2">
                              <Star size={12} fill="currentColor" /> Best Value
                          </div>
                      )}
                  </div>

                  {/* CONTENT SIDE */}
                  <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                      
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                                  {s.title}
                              </h2>
                              {/* 🕐 SMART DURATION BADGE */}
                              {s.displayDuration && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                                    <Clock size={10} /> {s.displayDuration}
                                </span>
                              )}
                          </div>
                          
                          <div className="text-right">
                              {/* 💰 SMART PRICE: "Starts From" only if needed */}
                              {s.hasVariants && <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starts From</span>}
                              
                              <span className="block text-3xl font-black text-blue-600">₹{s.minPrice}</span>
                              
                              {/* Show old price only if single variant (avoid confusion) */}
                              {s.previous_price && !s.hasVariants && (
                                  <span className="text-sm text-slate-400 line-through font-mono">₹{s.previous_price}</span>
                              )}
                          </div>
                      </div>

                      <p className="text-slate-500 leading-relaxed mb-8 line-clamp-3 text-sm font-medium">
                          {s.description}
                      </p>

                      {/* BENEFITS */}
                      {s.benefits && s.benefits.length > 0 && (
                          <div className="mb-10 grid grid-cols-2 gap-3">
                              {s.benefits.slice(0, 4).map((b: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
                                      <Zap size={14} className="text-blue-500 fill-blue-500" /> {b}
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* ACTIONS */}
                      <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                          <Link 
                              href={`/services/${s.id}`} 
                              className="flex-1 py-4 px-6 bg-white border-2 border-slate-100 text-slate-900 text-center rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all hover:border-slate-300 flex items-center justify-center gap-2"
                          >
                              Details <ArrowRight size={14} />
                          </Link>
                          <Link 
                              href={`/book?serviceId=${s.id}`} 
                              className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2"
                          >
                              Book Session <Sparkles size={14} />
                          </Link>
                      </div>

                  </div>
              </motion.div>
             ))
          ) : (
             <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white">
                 <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No active therapies found</p>
             </div>
          )}
        </motion.div>

      </div>
    </main>
  );
}