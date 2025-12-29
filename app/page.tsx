"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import HomeGallerySlider from "@/components/HomeGallerySlider";

// FALLBACK: If a database image fails, this generic "Relaxing Water" image shows instead.
const FALLBACK_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop";

export default function Home() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]); 
  const [gallery, setGallery] = useState<any[]>([]);
  const [founder, setFounder] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: t } = await supabase.from("testimonials").select("*").eq("is_active", true).limit(3);
      if (t) setTestimonials(t);
      
      const { data: s } = await supabase.from("services").select("*").eq("is_active", true).limit(4);
      if (s) setServices(s);
      
      const { data: g } = await supabase.from("gallery_images").select("*").limit(5);
      if (g) setGallery(g);
      
      const { data: f } = await supabase.from("founder_profile").select("*").single();
      if (f) setFounder(f);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-black/40 z-10"></div>
             {/* Using standard img for stability */}
             <img 
                src="https://images.unsplash.com/photo-1544367563-12123d896889?q=80&w=2070" 
                alt="Ice Bath Hero" 
                className="w-full h-full object-cover"
             />
        </div>

        <div className="relative z-20 text-center text-white max-w-4xl px-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-4 animate-fade-in-up drop-shadow-lg">
            CHILL.THRIVE
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-wide mb-10 text-slate-100 animate-fade-in-up delay-100">
            Rejuvenate your body. Reset your mind.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
            <Link href="/book" className="px-10 py-4 bg-cyan-400 text-black rounded-full font-bold text-sm uppercase tracking-widest hover:bg-cyan-300 transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              Book a Session
            </Link>
            <Link href="#services" className="px-10 py-4 border border-white text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. SERVICES PREVIEW --- */}
      <section id="services" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Recovery Menu</h2>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">CHOOSE YOUR THERAPY</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(services.length > 0 ? services : [
                    { title: "Ice Bath", description: "Reduce inflammation instantly.", image_url: "https://images.unsplash.com/photo-1583562835057-a62d1beffbf3?q=80&w=600" },
                    { title: "Jacuzzi", description: "Heat therapy for deep relaxation.", image_url: "https://images.unsplash.com/photo-1560625699-75a7e828d542?q=80&w=600" },
                    { title: "Steam Bath", description: "Detoxify and clear your mind.", image_url: "https://images.unsplash.com/photo-1626305987793-27a3c3c5453e?q=80&w=600" },
                    { title: "Combo Therapy", description: "The ultimate contrast protocol.", image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600" }
                ]).map((s, i) => (
                    <Link key={i} href="/book" className="group block bg-white rounded-3xl overflow-hidden border border-zinc-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-500">
                        <div className="h-64 relative overflow-hidden bg-gray-200">
                            <img 
                                src={s.image_url || s.img || FALLBACK_IMG} 
                                alt={s.title || "Service"} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => {
                                    // If image fails, swap source to fallback instantly
                                    (e.target as HTMLImageElement).src = FALLBACK_IMG;
                                }}
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="p-8">
                            <h4 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6">{s.description || s.desc}</p>
                            <span className="inline-block text-xs font-black uppercase tracking-widest border-b-2 border-black group-hover:border-blue-600 group-hover:text-blue-600 pb-1">
                                Book Now
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      </section>

      {/* --- 3. WHY CHILL THRIVE --- */}
      <section className="py-24 px-6 bg-slate-950 text-white relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
                {[
                    { icon: "🔬", title: "Science-Backed", text: "Protocols based on physiology data." },
                    { icon: "👨‍⚕️", title: "Trained Pros", text: "Certified guides ensure your safety." },
                    { icon: "✨", title: "Premium Hygiene", text: "Medical-grade filtration systems." },
                    { icon: "🤝", title: "Community", text: "Join a tribe of disciplined individuals." }
                ].map((item, i) => (
                    <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-4xl mb-4">{item.icon}</div>
                        <h4 className="font-bold text-lg mb-2 text-cyan-400">{item.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{item.text}</p>
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
                    <h2 className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Success Stories</h2>
                    <h3 className="text-4xl font-black tracking-tight">REAL RESULTS</h3>
                </div>
                <Link href="/gallery" className="px-6 py-2 border border-slate-300 rounded-full text-xs font-bold uppercase hover:bg-black hover:text-white transition-all">
                    View All Stories
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.length > 0 ? testimonials.map(t => (
                    <div key={t.id} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                        <div className="text-yellow-400 text-xs mb-4">{"★".repeat(t.rating)}</div>
                        <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.message}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                {t.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900">{t.name}</p>
                                <p className="text-[10px] font-bold uppercase text-slate-400">{t.role}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                   <div className="col-span-3 text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Add testimonials in Admin to see them here.
                   </div>
                )}
            </div>
        </div>
      </section>

      {/* --- 5. FOUNDER --- */}
      {founder && (
        <section className="py-24 px-6 bg-black text-white text-center">
            <div className="max-w-4xl mx-auto">
                <blockquote className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-8">
                    "{founder.quote}"
                </blockquote>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white relative">
                        <img 
                            src={founder.image_url || FALLBACK_IMG} 
                            alt="Founder" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-lg">{founder.name}</p>
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">{founder.role}</p>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* --- 6. CTA --- */}
      <section className="py-24 px-6 bg-zinc-100 text-center">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-none text-slate-900">
                START YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">RECOVERY</span> TODAY.
            </h2>
            <Link href="/book" className="inline-block px-12 py-5 bg-black text-white rounded-full font-bold text-lg uppercase tracking-widest hover:bg-zinc-800 hover:scale-105 transition-all shadow-xl">
                Book Your First Session
            </Link>
        </div>
      </section>

    </main>
  );
}