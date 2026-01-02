"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function HomeGallerySlider({ images }: { images: any[] }) {
  const [current, setCurrent] = useState(0);

  // 1. SMART CHECK: Only start timer if we have more than 1 image
  useEffect(() => {
    if (!images || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(timer);
  }, [images]);

  // 2. EMPTY STATE: Graceful Fallback
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[600px] flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
        <span className="text-4xl mb-4 grayscale opacity-50">📷</span>
        <p className="text-sm font-mono uppercase tracking-widest">Gallery Coming Soon</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden rounded-xl group">
      
      {/* IMAGES */}
      {images.map((img, index) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={img.image_url}
            alt="Gallery Image"
            fill
            className="object-cover"
            priority={index === 0} // Load first image fast
            unoptimized // Allow external Supabase URLs
          />
          {/* Gradient Overlay for Text Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
        </div>
      ))}

      {/* NAVIGATION DOTS (Only show if > 1 image) */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button" // <--- Added type
              aria-label={`Go to slide ${idx + 1}`} // <--- Added aria-label
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                current === idx ? "bg-white w-8" : "bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* ARROWS (Only show on hover & if > 1 image) */}
      {images.length > 1 && (
        <>
            <button 
                type="button" // <--- Added type
                aria-label="Previous slide" // <--- Added aria-label
                onClick={() => setCurrent((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20"
            >
                ←
            </button>
            <button 
                type="button" // <--- Added type
                aria-label="Next slide" // <--- Added aria-label
                onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20"
            >
                →
            </button>
        </>
      )}

    </div>
  );
}