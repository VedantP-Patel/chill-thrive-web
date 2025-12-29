"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [contactInfo, setContactInfo] = useState({
    email: "hello@chillthrive.com",
    phone: "+91 98765 43210",
    address: "Chill Thrive, Surat, Gujarat"
  });

  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });

  // Fetch Admin Settings for Contact Info
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("*");
      if (data) {
        const map: any = {};
        data.forEach(item => map[item.key] = item.value);
        setContactInfo({
          email: map["contact_email"] || contactInfo.email,
          phone: map["contact_phone"] || contactInfo.phone,
          address: map["contact_address"] || contactInfo.address
        });
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
        setStatus("Error: Phone must be at least 10 digits.");
        return;
    }
    setLoading(true);
    setStatus("Sending...");

    const { error } = await supabase.from("contact_messages").insert([formData]);

    if (error) {
        setStatus("Failed to send. Try again.");
    } else {
        setStatus("Message Sent! We'll call you shortly.");
        setFormData({ name: "", phone: "", message: "" });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 pt-24 pb-20 selection:bg-cyan-300 selection:text-black">
      
      {/* HEADER */}
      <section className="text-center max-w-4xl mx-auto px-6 mb-16">
        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4">Get in Touch</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-slate-900">
          REACH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">THE LAB</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mx-auto">
          Questions about the protocol? Ready to book a group session? We are here.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* LEFT COLUMN: INFO & MAP */}
        <div className="space-y-12">
            
            {/* Contact Details Card */}
            <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-200">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Visit Us</h3>
                        <p className="text-xl font-medium text-slate-900 whitespace-pre-line">{contactInfo.address}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Connect</h3>
                        <a href={`mailto:${contactInfo.email}`} className="block text-xl font-bold text-blue-600 hover:underline mb-1">{contactInfo.email}</a>
                        <a href={`tel:${contactInfo.phone}`} className="block text-xl font-medium text-slate-900 hover:text-blue-600">{contactInfo.phone}</a>
                    </div>
                </div>
            </div>

            {/* Map Embed (Updated to Chill Thrive Surat) */}
            <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-zinc-200 shadow-lg relative group">
                <iframe 
                    src="https://maps.google.com/maps?q=Chill+Thrive+Surat&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none border-[6px] border-white/20 rounded-[2rem]"></div>
            </div>

        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className="bg-black text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-blue-600/30 rounded-full blur-[80px] pointer-events-none"></div>

            <h2 className="text-3xl font-bold mb-8 relative z-10">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Full Name</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500 outline-none transition-colors"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Phone</label>
                    <input 
                        type="tel" 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500 outline-none transition-colors"
                        placeholder="+91 00000 00000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})}
                        maxLength={10}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Message</label>
                    <textarea 
                        required 
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500 outline-none transition-colors resize-none"
                        placeholder="I'm interested in..."
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                    />
                </div>

                <button 
                    disabled={loading}
                    className="w-full py-5 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Sending..." : "Send Message"}
                </button>

                {status && (
                    <p className={`text-center text-sm font-bold mt-4 ${status.includes("Error") ? "text-red-500" : "text-green-400"}`}>
                        {status}
                    </p>
                )}
            </form>
        </div>

      </div>
    </main>
  );
}