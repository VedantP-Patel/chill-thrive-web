"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock, Users, ArrowLeft, Zap, ShieldCheck, Tag } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      const { data } = await supabase.from("services").select("*").eq("id", id).single();
      
      if (data) {
          setService(data);
          
          // 🧠 SMART VARIANT LOGIC
          let parsedVariants = [];
          try {
              if (Array.isArray(data.variants)) parsedVariants = data.variants;
              else if (typeof data.variants === 'string') parsedVariants = JSON.parse(data.variants);
          } catch(e) {}

          if (parsedVariants.length > 0) {
              setVariants(parsedVariants);
              // Find lowest price
              const prices = parsedVariants.map((v: any) => Number(v.price));
              setMinPrice(Math.min(...prices));
          } else {
              // No variants, use base price
              setMinPrice(data.price);
          }
      }
      setLoading(false);
    };
    fetchService();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-blue-600 font-mono text-xs font-bold animate-pulse tracking-widest">LOADING EXPERIENCE...</p>
        </div>
    </div>
  );

  if (!service) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-mono">SERVICE NOT FOUND</div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 🌌 HERO IMAGE SECTION */}
      <div className="relative h-[80vh] w-full overflow-hidden bg-slate-900">
        <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
        >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>
            
            <img 
                src={service.detail_image_url || service.image_url || FALLBACK_IMG} 
                className="w-full h-full object-cover opacity-90"
                alt={service.title}
                onError={(e) => (e.target as HTMLImageElement).src = FALLBACK_IMG}
            />
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full z-20 pb-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <Link href="/services" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white hover:bg-white hover:text-slate-900 transition-all mb-8 text-xs font-bold uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Menu
                    </Link>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md shadow-lg shadow-blue-600/30">
                            {service.type === 'combo' ? 'Multi-Stage' : 'Single Session'}
                        </span>
                        {service.badge && (
                            <span className="px-3 py-1 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-md">
                                {service.badge}
                            </span>
                        )}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 max-w-4xl leading-[0.9] drop-shadow-lg">
                        {service.title}
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-200 max-w-2xl font-medium leading-relaxed drop-shadow-md">
                        {service.description}
                    </p>
                </motion.div>
            </div>
        </div>
      </div>

      {/* 📄 CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
        
        {/* LEFT: DETAILS */}
        <div className="lg:col-span-7 space-y-16">
            
            {/* ABOUT */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-blue-600 rounded-full"></span> About the Therapy
                </h2>
                <div className="prose prose-lg text-slate-600 leading-loose whitespace-pre-line font-medium">
                    {service.long_description || "Detailed information regarding this session will be provided by our specialists upon arrival."}
                </div>
            </motion.section>

            {/* BENEFITS */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <span className="w-8 h-1 bg-blue-600 rounded-full"></span> Core Benefits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.benefits && service.benefits.length > 0 ? (
                        service.benefits.map((benefit: string, index: number) => (
                            <div key={index} className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                                <span className="mt-1 w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Check size={14} strokeWidth={4} />
                                </span>
                                <span className="font-bold text-slate-700 text-sm uppercase tracking-wide group-hover:text-blue-900">{benefit}</span>
                            </div>
                        ))
                    ) : <p className="text-slate-400 font-mono text-xs">NO BENEFITS LISTED</p>}
                </div>
            </motion.section>

        </div>

        {/* RIGHT: BOOKING CARD */}
        <div className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-24">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

                    {/* PRICING HEADER */}
                    <div className="text-center mb-8 border-b border-slate-100 pb-8">
                        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Investment</p>
                        <div className="flex flex-col items-center">
                            {variants.length > 0 && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starts From</span>}
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-slate-900">₹{minPrice}</span>
                                {service.previous_price && variants.length === 0 && <span className="text-xl text-slate-400 line-through font-mono">₹{service.previous_price}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 📋 AVAILABLE PLANS (New Feature) */}
                    {variants.length > 0 && (
                        <div className="mb-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Available Plans</p>
                            <div className="space-y-2">
                                {variants.map((v: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-blue-500"/>
                                            <span className="text-sm font-bold text-slate-700">{v.duration}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">₹{v.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATIC INFO (If no variants) */}
                    {variants.length === 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                <Clock className="mx-auto text-blue-600 mb-2" size={20} />
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Duration</p>
                                <p className="text-slate-900 font-bold">{service.duration || "60 Mins"}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                <Users className="mx-auto text-blue-600 mb-2" size={20} />
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Capacity</p>
                                <p className="text-slate-900 font-bold">{service.capacity || 1} Person</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Link 
                            href={`/book?serviceId=${service.id}`} 
                            className="flex items-center justify-center gap-2 w-full py-5 bg-blue-600 text-white font-black text-center rounded-xl uppercase tracking-[0.2em] text-sm hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:-translate-y-1"
                        >
                            Book Appointment <Zap size={16} fill="currentColor" />
                        </Link>
                        <Link href="/services" className="block w-full py-4 bg-transparent text-slate-500 font-bold text-center rounded-xl uppercase tracking-[0.2em] border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs">
                            View Other Services
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Included In Session</p>
                        <div className="flex justify-center gap-6 text-slate-300">
                             <div className="flex flex-col items-center gap-2">
                                <span className="p-3 bg-slate-50 rounded-full text-blue-500"><ShieldCheck size={16}/></span>
                                <span className="text-[9px] font-bold uppercase text-slate-400">Privacy</span>
                             </div>
                             <div className="flex flex-col items-center gap-2">
                                <span className="p-3 bg-slate-50 rounded-full text-blue-500"><Users size={16}/></span>
                                <span className="text-[9px] font-bold uppercase text-slate-400">Expert</span>
                             </div>
                             <div className="flex flex-col items-center gap-2">
                                <span className="p-3 bg-slate-50 rounded-full text-blue-500"><Tag size={16}/></span>
                                <span className="text-[9px] font-bold uppercase text-slate-400">Offers</span>
                             </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

      </div>
    </main>
  );
}