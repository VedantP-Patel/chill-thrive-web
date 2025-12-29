"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

// Helper to generate random heights for dummy images to demonstrate Masonry
const getRandomHeight = () => Math.floor(Math.random() * (600 - 300 + 1) + 300);

export default function GalleryPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [category, setCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Events
      const { data: e } = await supabase.from("events").select("*").order("event_date", { ascending: false });
      if (e) setEvents(e);
      
      // Fetch Photos
      const { data: p } = await supabase.from("gallery_images").select("*").order("created_at", { ascending: false });
      if (p) {
        // Assign a random aspect ratio for demo purposes if it's a dummy image
        const enhancedPhotos = p.map(photo => ({
            ...photo,
            height: photo.height || getRandomHeight() // Fallback height for masonry demo
        }));
        setPhotos(enhancedPhotos);
      }
    };
    fetchData();
  }, []);

  const filteredPhotos = category === "all" ? photos : photos.filter(p => p.category === category);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black font-sans pb-20">
      
      {/* --- 1. HERO HEADER --- */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <p className="text-cyan-400 font-bold tracking-[0.3em] text-xs uppercase mb-4 animate-fade-in-up">Visual Evidence</p>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-4 text-white leading-none animate-fade-in-up delay-100">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">ARCHIVE</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light animate-fade-in-up delay-200">
             Community, discipline, and the daily grind.
          </p>
        </div>
      </section>

      {/* --- 2. EVENTS (Horizontal Scroll) --- */}
      {events.length > 0 && (
          <section className="mb-20">
            <div className="max-w-7xl mx-auto pl-6 md:px-6">
                <div className="flex items-center justify-between mb-8 pr-6">
                     <h2 className="text-xl font-bold border-l-4 border-cyan-500 pl-4">Recent Events</h2>
                     <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden md:block">Scroll →</span>
                </div>
                
                <div className="flex overflow-x-auto gap-4 pb-8 pr-6 snap-x snap-mandatory no-scrollbar">
                    {events.map(event => (
                        <div key={event.id} className="snap-center shrink-0 w-[85vw] md:w-[350px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group relative">
                            <div className="h-56 relative overflow-hidden">
                                <Image 
                                    src={event.cover_image_url || "https://placehold.co/600x400"} 
                                    alt={event.title} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                    unoptimized
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                                    {event.event_date}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* --- 3. PHOTO MASONRY GRID (The "Smart" Layout) --- */}
      <section className="px-4 md:px-6 max-w-7xl mx-auto min-h-screen relative">
        
        {/* FLOATING FILTER BAR (Glass Capsule) */}
        <div className="sticky top-24 z-30 mb-12 flex justify-center">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-2 rounded-full flex flex-wrap justify-center gap-1 shadow-2xl">
                {["all", "session", "community", "workshop", "bts"].map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                            category === cat 
                            ? "bg-white text-black shadow-lg transform scale-105" 
                            : "text-zinc-400 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* MASONRY COLUMNS */}
        {filteredPhotos.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filteredPhotos.map((photo) => (
                    <div 
                        key={photo.id} 
                        onClick={() => setSelectedImage(photo.image_url)}
                        className="break-inside-avoid mb-4 relative rounded-xl overflow-hidden group cursor-zoom-in border border-zinc-800 hover:border-zinc-500 transition-all duration-300 bg-zinc-900"
                    >
                        {/* SMART ARRANGEMENT TRICK:
                           1. Use 'width' & 'height' prop (or style) to respect aspect ratio.
                           2. Set width: 100%, height: auto via style.
                           3. DO NOT use 'fill' or 'aspect-square'.
                        */}
                        <img
                            src={photo.image_url} 
                            alt="Gallery" 
                            className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-[10px] font-bold text-black bg-cyan-400 px-2 py-1 rounded uppercase tracking-widest">
                                {photo.category || "General"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            // Empty State
            <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50">
                <span className="text-4xl mb-4 grayscale opacity-30">📸</span>
                <p className="text-sm">No photos found in this category.</p>
            </div>
        )}
      </section>

      {/* --- 4. LIGHTBOX MODAL --- */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-7xl max-h-[90vh]">
                <img 
                    src={selectedImage} 
                    alt="Full Screen" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                <button className="absolute top-4 right-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-full p-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}