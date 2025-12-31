"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// 1. STATIC FALLBACKS (Safety Net)
const FALLBACK_HERO = "https://images.unsplash.com/photo-1544367563-12123d896889?q=80&w=2070";
const FALLBACK_SERVICE_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000";

const DEFAULT_FEATURES = [
  { id: 1, icon: "🔬", title: "Science-backed recovery", desc: "Protocols based on physiology data." },
  { id: 2, icon: "👨‍⚕️", title: "Trained professionals", desc: "Certified guides ensure your safety." },
  { id: 3, icon: "✨", title: "Hygienic & premium setup", desc: "Medical-grade filtration systems." },
  { id: 4, icon: "🤝", title: "Community-driven wellness", desc: "Join a tribe of disciplined individuals." }
];

export default function Home() {
  // --- STATE ---
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]); 
  const [founder, setFounder] = useState<any>(null);
  
  // Page Configuration
  const [pageConfig, setPageConfig] = useState<any>({
    home_hero_title: "CHILL.THRIVE",
    home_hero_subtitle: "Rejuvenate your body. Reset your mind.",
    home_hero_img: "" 
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Testimonials
      const { data: t } = await supabase.from("testimonials").select("*").eq("is_active", true).limit(3);
      if (t) setTestimonials(t);
      
      // 2. Services
      const { data: s } = await supabase.from("services").select("*").eq("is_active", true).order("price").limit(4);
      if (s) setServices(s);
      
      // 3. Founder
      const { data: f } = await supabase.from("founder_profile").select("*").single();
      if (f) setFounder(f);

      // 4. SITE SETTINGS
      const { data: settings } = await supabase.from("settings").select("*");
      if (settings) {
          const map: any = {};
          settings.forEach(row => map[row.key] = row.value);
          setPageConfig((prev: any) => ({ ...prev, ...map }));
      }
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-900">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-black/40 z-10"></div>
             {/* Uses Admin Image with automatic fallback if link breaks */}
             <img 
                src={pageConfig.home_hero_img || FALLBACK_HERO} 
                alt="Hero Background" 
                className="w-full h-full object-cover opacity-90"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== FALLBACK_HERO) {
                        target.src = FALLBACK_HERO;
                    }
                }}
             />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white max-w-4xl px-6">
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 animate-fade-in-up drop-shadow-2xl uppercase leading-none">
            {pageConfig.home_hero_title}
          </h1>
          <p className="text-lg md:text-2xl font-light tracking-wide mb-10 text-slate-100 animate-fade-in-up delay-100 max-w-2xl mx-auto">
            {pageConfig.home_hero_subtitle}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
            {/* Direct Booking CTA */}
            <Link href="/book" className="px-10 py-4 bg-cyan-400 text-black rounded-full font-bold text-sm uppercase tracking-widest hover:bg-cyan-300 transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              Book Session
            </Link>
            {/* Scroll/Explore CTA */}
            <Link href="/services" className="px-10 py-4 border border-white text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Explore Menu
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. SERVICES PREVIEW (Updated Links) --- */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Recovery Menu</h2>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">CHOOSE YOUR THERAPY</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((s, i) => (
                    <Link 
                        key={i} 
                        href={`/services/${s.id}`} // <--- NEW LINK: Goes to Detail Page first
                        className="group block bg-white rounded-[2rem] overflow-hidden border border-zinc-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-500"
                    >
                        <div className="h-64 relative overflow-hidden bg-gray-200">
                            <img 
                                src={s.image_url || FALLBACK_SERVICE_IMG} 
                                alt={s.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                onError={(e) => (e.target as HTMLImageElement).src = FALLBACK_SERVICE_IMG} 
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="p-8">
                            <h4 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6">{s.description}</p>
                            <span className="inline-block text-xs font-black uppercase tracking-widest border-b-2 border-black group-hover:border-blue-600 group-hover:text-blue-600 pb-1">
                                View Details
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      </section>

      {/* --- 3. WHY CHILL THRIVE --- */}
      <section className="py-24 px-6 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">The Standard</h2>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
                    {pageConfig.why_title || "Why Chill Thrive"}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
                {DEFAULT_FEATURES.map((f) => (
                    <div key={f.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group hover:-translate-y-2 duration-300">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                            {pageConfig[`why_${f.id}_icon`] || f.icon}
                        </div>
                        <h4 className="font-bold text-lg mb-3 text-cyan-400">
                            {pageConfig[`why_${f.id}_title`] || f.title}
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            {pageConfig[`why_${f.id}_desc`] || f.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- 4. TESTIMONIALS --- */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                    <h2 className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Community</h2>
                    <h3 className="text-4xl font-black tracking-tight">REAL RESULTS</h3>
                </div>
                <Link href="/gallery" className="px-6 py-2 border border-slate-300 rounded-full text-xs font-bold uppercase hover:bg-black hover:text-white transition-all">
                    Visual Evidence
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.length > 0 ? testimonials.map(t => (
                    <div key={t.id} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative hover:shadow-lg transition-shadow">
                        <div className="text-yellow-400 text-xs mb-4">{"★".repeat(t.rating)}</div>
                        <p className="text-slate-700 italic mb-6 leading-relaxed font-medium">"{t.message}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {t.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900">{t.name}</p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">{t.role}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                   <div className="col-span-3 text-center py-20 text-slate-400 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      No testimonials yet. Add them in Admin Panel.
                   </div>
                )}
            </div>
        </div>
      </section>

      {/* --- 5. CTA --- */}
      <section className="py-24 px-6 bg-zinc-100 text-center">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-none text-slate-900 uppercase">
                {pageConfig.cta_title || "START YOUR RECOVERY TODAY."}
            </h2>
            <Link href="/book" className="inline-block px-12 py-5 bg-black text-white rounded-full font-bold text-lg uppercase tracking-widest hover:bg-zinc-800 hover:scale-105 transition-all shadow-xl">
                Book First Session
            </Link>
        </div>
      </section>

    </main>
  );
}