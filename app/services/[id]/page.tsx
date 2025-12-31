"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000";

export default function ServiceDetailPage() {
  const { id } = useParams(); // Get ID from URL
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
      if (data) setService(data);
      setLoading(false);
    };
    fetchService();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin text-4xl">↻</div></div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center bg-white text-slate-400">Service not found.</div>;

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      
      {/* HERO HEADER */}
      <div className="relative h-[60vh] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
            src={service.detail_image_url || service.image_url || FALLBACK_IMG} 
            className="w-full h-full object-cover opacity-90"
            alt={service.title}
            onError={(e) => (e.target as HTMLImageElement).src = FALLBACK_IMG}
        />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20 bg-gradient-to-t from-black/90 to-transparent pt-32">
            <div className="max-w-7xl mx-auto">
                <span className="inline-block px-3 py-1 bg-cyan-400 text-black text-xs font-bold uppercase tracking-widest rounded mb-4">
                    {service.type === 'combo' ? 'Combo Package' : 'Recovery Protocol'}
                </span>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-4">{service.title}</h1>
                <p className="text-xl text-slate-200 max-w-2xl font-light">{service.description}</p>
            </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT: DETAILS (Span 8) */}
        <div className="lg:col-span-8 space-y-12">
            
            {/* THE PROTOCOL */}
            <section>
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">The Protocol</h2>
                <div className="prose prose-lg text-slate-600 leading-relaxed whitespace-pre-line">
                    {service.long_description || "No detailed protocol available yet."}
                </div>
            </section>

            {/* BENEFITS */}
            <section>
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6">Key Benefits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.benefits && service.benefits.length > 0 ? (
                        service.benefits.map((benefit: string, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-green-500 font-bold border shadow-sm">✓</span>
                                <span className="font-bold text-slate-800 text-sm uppercase">{benefit}</span>
                            </div>
                        ))
                    ) : <p className="text-slate-400 italic">Benefits not listed.</p>}
                </div>
            </section>

        </div>

        {/* RIGHT: STICKY BOOKING CARD (Span 4) */}
        <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                <div className="text-center mb-8">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-2">Session Price</p>
                    <div className="flex justify-center items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900">₹{service.price}</span>
                        {service.previous_price && <span className="text-xl text-slate-400 line-through">₹{service.previous_price}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Per Person • 60 Mins</p>
                </div>

                <div className="space-y-3">
                    <Link 
                        href={`/book?serviceId=${service.id}`} 
                        className="block w-full py-5 bg-black text-white font-bold text-center rounded-xl uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all shadow-lg hover:scale-105"
                    >
                        Book This Session
                    </Link>
                    <Link href="/services" className="block w-full py-4 bg-white text-slate-500 font-bold text-center rounded-xl uppercase tracking-widest border hover:bg-slate-50 transition-all text-xs">
                        View Other Services
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Included</p>
                    <div className="flex justify-center gap-4 mt-4 text-2xl text-slate-300">
                        <span>🚿</span><span>lz</span><span>☕</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}