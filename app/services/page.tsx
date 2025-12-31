"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1544367563-12123d896889?q=80&w=1000";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      // Fetch active services sorted by price
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("price");
      if (data) setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 text-slate-900 pt-24 pb-20 px-6 font-sans">
      
      {/* HEADER */}
      <section className="text-center max-w-4xl mx-auto mb-16">
        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4">The Menu</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
          RECOVERY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">PROTOCOLS</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          Choose your therapy. From acute inflammation control to deep mental relaxation.
        </p>
      </section>

      {/* SERVICES LIST */}
      <div className="max-w-5xl mx-auto space-y-12">
        {loading ? (
           <div className="text-center py-20 text-slate-400 animate-pulse">Loading Protocols...</div>
        ) : services.length > 0 ? (
           services.map((s, index) => (
            <div key={s.id} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-zinc-100 group transition-all hover:shadow-2xl`}>
                
                {/* IMAGE SIDE */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-gray-200">
                    <img 
                        src={s.image_url || FALLBACK_IMG} 
                        alt={s.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        onError={(e) => {
                            // SMART FIX: If image fails (404/403), swap to Fallback instantly
                            (e.target as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                    />
                    {s.type === 'combo' && (
                        <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            🧩 Best Value
                        </div>
                    )}
                </div>

                {/* CONTENT SIDE */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-3xl font-black tracking-tight leading-none">{s.title}</h2>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-blue-600">₹{s.price}</span>
                            {s.previous_price && <span className="text-sm text-gray-400 line-through">₹{s.previous_price}</span>}
                        </div>
                    </div>

                    <p className="text-slate-500 leading-relaxed mb-6 line-clamp-3">{s.description}</p>

                    {/* BENEFITS PREVIEW */}
                    {s.benefits && s.benefits.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Areas</h3>
                            <ul className="grid grid-cols-2 gap-2">
                                {s.benefits.slice(0, 4).map((b: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <span className="text-cyan-500">✓</span> {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-4 mt-auto">
                        <Link 
                            href={`/services/${s.id}`} 
                            className="flex-1 py-4 bg-white border-2 border-black text-black text-center rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-100 transition-all"
                        >
                            View Details
                        </Link>
                        <Link 
                            href="/book" 
                            className="flex-1 py-4 bg-black text-white text-center rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg"
                        >
                            Book Now
                        </Link>
                    </div>
                </div>
            </div>
        ))
       ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400">No active services found.</p>
                <Link href="/admin" className="text-blue-600 underline text-sm mt-2 block">Go to Admin to add services</Link>
            </div>
       )}
      </div>

    </main>
  );
}