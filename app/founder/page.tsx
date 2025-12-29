"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function FounderPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from("founder_profile").select("*").single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-cyan-300 selection:text-black font-sans">
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex flex-col md:flex-row">
        
        {/* LEFT: Founder Photo */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative bg-slate-100 overflow-hidden md:sticky md:top-0">
          <Image 
            src={profile.image_url || "https://placehold.co/800x1200"} 
            alt="Founder" 
            fill 
            className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            priority
            unoptimized
          />
        </div>

        {/* RIGHT: Content Scroll */}
        <div className="w-full md:w-1/2 px-8 py-20 md:p-24 bg-white flex flex-col justify-center">
          
          <div className="hidden md:block mb-12">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-2 text-slate-900 uppercase leading-none">
              {profile.name.split(" ")[0]} <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{profile.name.split(" ")[1]}</span>
            </h1>
            <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-sm mt-4">{profile.role}</p>
          </div>

          <div className="space-y-8 text-lg leading-relaxed text-slate-600 whitespace-pre-line">
             {profile.story}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">✍️</div>
             <div>
                <p className="font-bold text-sm">Connect with {profile.name.split(" ")[0]}</p>
                <a href="#" className="text-xs text-blue-600 hover:underline">LinkedIn</a> • <a href="#" className="text-xs text-blue-600 hover:underline">Twitter</a>
             </div>
          </div>
        </div>
      </section>

      {/* MISSION & VALUES */}
      <section className="bg-slate-950 text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
                <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4">The Philosophy</p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter">OUR DNA</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Mission */}
                <div className="md:col-span-2 bg-zinc-900 p-10 rounded-[2rem] border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] group-hover:bg-blue-600/30 transition-colors"></div>
                    <h3 className="text-2xl font-bold mb-4 relative z-10">The Mission</h3>
                    <p className="text-zinc-400 text-lg leading-relaxed relative z-10">{profile.mission}</p>
                </div>

                {/* Value 1 */}
                <div className="bg-zinc-900 p-10 rounded-[2rem] border border-zinc-800 flex flex-col justify-center">
                    <span className="text-4xl mb-4">🧪</span>
                    <h3 className="text-xl font-bold mb-2">{profile.value_1_title}</h3>
                    <p className="text-zinc-400 text-sm">{profile.value_1_desc}</p>
                </div>

                {/* Value 2 */}
                <div className="bg-zinc-900 p-10 rounded-[2rem] border border-zinc-800 flex flex-col justify-center">
                    <span className="text-4xl mb-4">🤝</span>
                    <h3 className="text-xl font-bold mb-2">{profile.value_2_title}</h3>
                    <p className="text-zinc-400 text-sm">{profile.value_2_desc}</p>
                </div>

                {/* Quote */}
                <div className="md:col-span-2 bg-gradient-to-r from-blue-900 to-slate-900 p-10 rounded-[2rem] border border-blue-800 flex items-center">
                     <blockquote className="text-xl md:text-2xl font-medium leading-relaxed italic text-blue-100">
                        "{profile.quote}"
                     </blockquote>
                </div>
            </div>
        </div>
      </section>
    </main>
  );
}