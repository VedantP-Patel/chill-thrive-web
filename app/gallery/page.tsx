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
      <section className="relative pt-32 pb-12 px-6 overflow-hidden text-center">
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-cyan-400 font-bold tracking-[0.3em] text-xs uppercase mb-4 animate-fade-in-up">Visual Evidence</p>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 text-white leading-none animate-fade-in-up delay-100">
            THE ARCHIVE
          </h1>
        </div>
      </section>

      {/* --- 2. FLOATING FILTER CAPSULE (FIXED) --- */}
      <div className="sticky top-24 z-40 flex justify-center mb-12 px-4">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex flex-wrap justify-center gap-1 shadow-2xl ring-1 ring-black/50">
            {["all", "session", "community", "workshop", "bts"].map(cat => (
                <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
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

      {/* --- 3. PHOTO MASONRY GRID (FIXED) --- */}
      <section className="px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
        {filteredPhotos.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filteredPhotos.map((photo) => (
                    <div 
                        key={photo.id} 
                        onClick={() => setSelectedImage(photo.image_url)}
                        className="break-inside-avoid mb-4 relative rounded-xl overflow-hidden group cursor-zoom-in border border-zinc-800 bg-zinc-900 shadow-xl"
                    >
                        <img
                            src={photo.image_url} 
                            alt="Gallery" 
                            className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-[10px] font-bold text-black bg-cyan-400 px-2 py-1 rounded uppercase tracking-widest">
                                {photo.category || "General"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
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
            </div>
        </div>
      )}
    </main>
  );
}