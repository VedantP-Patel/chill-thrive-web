import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

// FORCE DYNAMIC (Important for ensuring price updates show immediately)
export const revalidate = 0;
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// FALLBACK IMAGE
const FALLBACK_IMG = "https://images.unsplash.com/photo-1544367563-12123d896889?q=80&w=1000";

export default async function ServiceDetailPage(props: PageProps) {
  // Unwrap params for Next.js 15+
  const params = await props.params;

  // 1. Fetch Service
  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !service) {
    notFound();
  }

  // 2. Fetch Testimonials (Optional: showing real social proof)
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  // Defaults
  const benefits = service.benefits || ["Deep Recovery", "Circulation Boost", "Mental Focus"];
  const heroImage = service.detail_image_url || service.image_url || FALLBACK_IMG;
  const price30 = service.price_30 || Math.round(service.price * 0.6);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans pt-24 pb-20">
      
      {/* --- HERO HEADER --- */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <Link href="/services" className="text-xs font-bold uppercase text-slate-400 hover:text-black mb-4 inline-block transition-colors">
          ← Back to Menu
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                {service.type === 'combo' && (
                    <span className="inline-block px-3 py-1 mb-3 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                        🧩 Combo Package
                    </span>
                )}
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                    {service.title}
                </h1>
            </div>
            <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
                {service.description}
            </p>
        </div>
      </section>

      {/* --- CONTENT GRID --- */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: VISUALS & DETAILS (Span 8) */}
        <div className="lg:col-span-8 space-y-12">
            
            {/* Hero Image */}
            <div className="relative h-[50vh] w-full rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-xl border border-zinc-100">
                <Image 
                    src={heroImage} 
                    alt={service.title} 
                    fill 
                    className="object-cover"
                    priority
                    unoptimized
                />
            </div>

            {/* Protocol Description */}
            <div className="prose prose-lg prose-slate max-w-none">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">The Protocol</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                    {service.long_description || service.description || "Experience the ultimate recovery session designed to reset your nervous system and reduce inflammation."}
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Physiological Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">✓</div>
                            <span className="font-medium text-slate-700">{b}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Member Stories (Mini) */}
            {testimonials && testimonials.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Member Experiences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {testimonials.slice(0, 2).map((t: any) => (
                             <div key={t.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                                 <p className="text-slate-600 italic text-sm mb-4">"{t.message}"</p>
                                 <p className="text-xs font-bold text-slate-900">— {t.name}</p>
                             </div>
                         ))}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: STICKY BOOKING CARD (Span 4) */}
        <div className="lg:col-span-4 relative">
            <div className="sticky top-24 bg-white p-8 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.08)] border border-slate-100 space-y-8">
                
                {/* Price Header */}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Pricing</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-blue-600">₹{service.price}</span>
                        <span className="text-lg font-bold text-slate-400">/ 60m</span>
                    </div>
                    {service.previous_price && (
                        <p className="text-sm text-slate-400 line-through mt-1">Was ₹{service.previous_price}</p>
                    )}
                </div>

                {/* 30 Min Option */}
                <div className="flex justify-between items-center py-4 border-t border-slate-100">
                    <span className="font-bold text-slate-700">30 Min Session</span>
                    <span className="font-bold text-slate-900">₹{price30}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <span className="block text-2xl">👥</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mt-1">Up to {service.capacity}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <span className="block text-2xl">🌡️</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mt-1">Temp Control</span>
                    </div>
                </div>

                {/* CTA */}
                <Link 
                    href="/book" 
                    className="block w-full py-5 bg-black text-white text-center rounded-xl font-bold text-lg uppercase tracking-widest hover:bg-zinc-800 transition-all hover:scale-[1.02] shadow-xl"
                >
                    Book Now
                </Link>
                
                <p className="text-xs text-center text-slate-400 leading-relaxed">
                    *Instant confirmation. Cancellations allowed up to 24h prior.
                </p>
            </div>
        </div>

      </section>

    </main>
  );
}