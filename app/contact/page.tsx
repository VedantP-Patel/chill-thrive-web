"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  const [contactInfo, setContactInfo] = useState({ 
    email: "recovery@chillthrive.in", 
    phone: "+91 98765 43210", 
    address: "Vadodara, Gujarat" 
  });
  const [mapUrl, setMapUrl] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });

  // 🔒 1. SELF-HEALING URL PARSER
  const cleanMapUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    if (rawUrl.includes('<iframe') && rawUrl.includes('src="')) {
      const match = rawUrl.match(/src="([^"]+)"/);
      return match ? match[1] : rawUrl;
    }
    return rawUrl;
  };

  // 2. FETCH SETTINGS (Key-Value Compatible)
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from("settings").select("*");

      if (data && !error) {
        const settingsMap: any = {};
        data.forEach(item => {
            if (item.key) settingsMap[item.key] = item.value;
        });

        setContactInfo({ 
            email: settingsMap["contact_email"] || "recovery@chillthrive.in", 
            phone: settingsMap["contact_phone"] || "+91 98765 43210", 
            address: settingsMap["contact_address"] || "Vadodara, Gujarat" 
        });

        const rawMapUrl = settingsMap["map_url"] || "";
        setMapUrl(cleanMapUrl(rawMapUrl));
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) { setStatus("Error: Phone must be at least 10 digits."); return; }
    
    setLoading(true); setStatus("Sending...");
    
    const { error } = await supabase.from("contact_messages").insert([formData]);
    
    if (error) {
        setStatus("Failed. Try again."); 
    } else { 
        setStatus("Message Sent!"); 
        setFormData({ name: "", phone: "", message: "" }); 
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 pt-24 pb-20 selection:bg-cyan-300 selection:text-black">
      
      {/* HEADER */}
      <section className="text-center max-w-4xl mx-auto px-6 mb-12 md:mb-16">
        <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4">Get in Touch</p>
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6 text-slate-900">
            REACH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">THE LAB</span>
        </h1>
        <p className="text-sm md:text-xl text-slate-500 max-w-xl mx-auto px-4">
            Questions about the protocol? Ready to book a group session?
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-24">
        
        {/* LEFT: INFO & MAP */}
        <div className="space-y-8 md:space-y-12 order-2 lg:order-1">
            <div className="bg-zinc-50 p-6 md:p-8 rounded-[2rem] border border-zinc-200">
                <div className="space-y-6 md:space-y-8">
                    <div>
                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Visit Us</h3>
                        <p className="text-lg md:text-xl font-medium text-slate-900 whitespace-pre-line">{contactInfo.address}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Connect</h3>
                        <a href={`mailto:${contactInfo.email}`} className="block text-lg md:text-xl font-bold text-blue-600 hover:underline mb-1 break-all">{contactInfo.email}</a>
                        <a href={`tel:${contactInfo.phone}`} className="block text-lg md:text-xl font-medium text-slate-900 hover:text-blue-600">{contactInfo.phone}</a>
                    </div>
                </div>
            </div>

            {/* MAP CONTAINER (Full Color Always) */}
            <div className="h-[300px] md:h-[400px] w-full rounded-[2rem] overflow-hidden border border-zinc-200 shadow-lg relative bg-zinc-100">
                {mapUrl ? (
                    <iframe 
                        src={mapUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full" // 🔒 REMOVED 'grayscale' class
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                        <span className="text-4xl mb-2">🗺️</span>
                        <p className="text-xs font-bold uppercase tracking-widest">Map Loading...</p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: CONTACT FORM */}
        <div className="bg-black text-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden order-1 lg:order-2">
            <div className="absolute top-[-20%] right-[-20%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-blue-600/30 rounded-full blur-[60px] md:blur-[80px] pointer-events-none"></div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 relative z-10">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative z-10">
                <div>
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Full Name</label>
                    <input type="text" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-white focus:border-cyan-500 outline-none transition-colors" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Phone</label>
                    <input type="tel" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-white focus:border-cyan-500 outline-none transition-colors" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} maxLength={10} />
                </div>
                <div>
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Message</label>
                    <textarea required rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-white focus:border-cyan-500 outline-none transition-colors resize-none" placeholder="Message..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                </div>
                
                <button disabled={loading} className="w-full py-4 md:py-5 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-all uppercase tracking-widest disabled:opacity-50 text-sm md:text-base">
                    {loading ? "Sending..." : "Send Message"}
                </button>
                
                {status && <p className={`text-center text-sm font-bold mt-4 ${status.includes("Error") || status.includes("Failed") ? "text-red-500" : "text-green-400"}`}>{status}</p>}
            </form>
        </div>

      </div>
    </main>
  );
}