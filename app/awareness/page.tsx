import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React from "react";

export const revalidate = 0; 
export const dynamic = "force-dynamic";

// --- STANDARD RENDERER (For other sections) ---
const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  const cleanContent = content.replace(/\\n/g, "\n");
  const paragraphs = cleanContent.split("\n");

  return (
    <div className="space-y-4">
      {paragraphs.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-2" />;
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
            return (
                <div key={index} className="flex items-start gap-3 pl-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                    <p className="leading-7 text-lg text-slate-300">{parseBold(line.replace(/^[•-]\s*/, ""))}</p>
                </div>
            )
        }
        return <p key={index} className="leading-8 text-lg text-slate-400">{parseBold(line)}</p>;
      })}
    </div>
  );
};

// --- SPECIAL RENDERER FOR MYTHS & FACTS ---
const MythFactRenderer = ({ content }: { content: string }) => {
    if (!content) return null;
    const cleanContent = content.replace(/\\n/g, "\n");
    // Split by double newlines to separate Myth/Fact blocks if possible, or just parse line by line
    const lines = cleanContent.split("\n").filter(l => l.trim().length > 0);

    return (
        <div className="space-y-6">
            {lines.map((line, index) => {
                const isMyth = line.toLowerCase().startsWith("myth:");
                const isFact = line.toLowerCase().startsWith("fact:");

                if (isMyth) {
                    return (
                        <div key={index} className="flex gap-3 items-start opacity-70">
                            <span className="text-red-500 font-bold text-xl">✕</span>
                            <p className="text-red-300/80 italic line-through decoration-red-500/30 text-lg">
                                {line.replace(/myth:/i, "").trim()}
                            </p>
                        </div>
                    );
                }

                if (isFact) {
                    return (
                        <div key={index} className="flex gap-3 items-start bg-cyan-950/30 p-4 rounded-xl border border-cyan-500/20 shadow-sm mb-6">
                            <span className="text-green-400 font-bold text-xl">✓</span>
                            <p className="text-cyan-100 font-medium text-lg leading-relaxed">
                                {parseBold(line.replace(/fact:/i, "").trim())}
                            </p>
                        </div>
                    );
                }

                // Normal text inside this block
                return <p key={index} className="text-slate-400 pl-8">{line}</p>;
            })}
        </div>
    );
}

const parseBold = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-bold text-white tracking-wide">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

export default async function AwarenessPage() {
  const { data: blocks } = await supabase.from("content_blocks").select("*").eq("category", "awareness");
  const getBlock = (slug: string) => blocks?.find(b => b.slug === slug) || { title: "", content: "" };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500 selection:text-black font-sans">
      
      {/* HERO */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-6 backdrop-blur-sm">
            Physiology & Performance
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 drop-shadow-2xl">
            MASTER YOUR <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">BIOLOGY.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Recovery is an active process. Understand the mechanisms behind the cold.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        
        {/* GRID 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-slate-900/50 p-8 md:p-12 rounded-[2rem] border border-slate-800 hover:border-slate-700 transition-colors backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 text-blue-400 border border-blue-500/20">❄️</div>
                <h2 className="text-3xl font-bold mb-6 tracking-tight text-white">{getBlock('cold-therapy').title || 'The Basics'}</h2>
                <MarkdownRenderer content={getBlock('cold-therapy').content} />
            </section>

            <section className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 rounded-[2rem] border border-cyan-900/30 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 text-cyan-300 border border-cyan-500/20">⚡</div>
                    <h2 className="text-3xl font-bold mb-6 tracking-tight text-white">
                        <span className="text-cyan-400">Deep Dive:</span> {getBlock('science').title || 'The Science'}
                    </h2>
                    <MarkdownRenderer content={getBlock('science').content} />
                </div>
            </section>
        </div>

        {/* CONTRAST */}
        <section className="relative rounded-[2rem] overflow-hidden border border-slate-800 bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                <div className="md:col-span-5 bg-gradient-to-br from-red-900 to-blue-900 relative p-10 flex flex-col justify-center items-center text-center text-white">
                    <div className="absolute inset-0 bg-slate-950/40"></div>
                    <div className="relative z-10">
                        <h3 className="text-6xl font-black mb-2 opacity-90 drop-shadow-xl">VS</h3>
                        <p className="font-bold tracking-[0.3em] text-sm uppercase opacity-75">Fire & Ice</p>
                    </div>
                </div>
                <div className="md:col-span-7 p-10 md:p-16 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">{getBlock('heat-vs-cold').title || 'Heat vs. Cold'}</h2>
                    <MarkdownRenderer content={getBlock('heat-vs-cold').content} />
                </div>
            </div>
        </section>

        {/* GRID 2: MYTHS (HIGHLIGHTED) & SAFETY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 4. MYTHS - USING SPECIAL RENDERER */}
            <section className="lg:col-span-2 bg-slate-900 p-8 md:p-12 rounded-[2rem] border border-slate-800">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-3xl grayscale opacity-70">🤔</span>
                    <h2 className="text-2xl font-bold text-white">Debunking Myths</h2>
                </div>
                {/* USE SPECIAL RENDERER HERE */}
                <div className="bg-slate-950/30 p-2 md:p-6 rounded-3xl">
                    <MythFactRenderer content={getBlock('myths').content} />
                </div>
            </section>

            {/* 5. SAFETY */}
            <section className="lg:col-span-1 bg-red-950/20 p-8 rounded-[2rem] border border-red-900/30 flex flex-col">
                <div className="mb-6">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-xl text-red-500 mb-4 border border-red-500/20">⚕️</div>
                    <h2 className="text-xl font-bold text-red-400">{getBlock('risks').title || 'Medical Safety'}</h2>
                </div>
                <div className="flex-1 text-red-200/80 text-sm leading-6">
                    <MarkdownRenderer content={getBlock('risks').content} />
                </div>
            </section>
        </div>

        {/* FOOTER */}
        <div className="py-20 text-center">
            <h3 className="text-3xl font-bold mb-8 text-white">Ready to apply the science?</h3>
            <Link href="/book" className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-black transition-all duration-200 bg-white rounded-full hover:bg-cyan-400 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <span>Book a Session</span>
                <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </Link>
        </div>

      </div>
    </main>
  );
}