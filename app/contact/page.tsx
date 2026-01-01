"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence, Variants } from "framer-motion"; // <--- Added 'Variants'

// --- ANIMATION VARIANTS ---
// Explicitly typed as 'Variants' to fix the build error
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut" // TypeScript now knows this is a valid Easing type
    } 
  }
};

export default function ContactPage() {
  // ... rest of your component code remains exactly the same ...
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  
  // Data State
  const [contactInfo, setContactInfo] = useState({ 
    email: "recovery@chillthrive.in", 
    phone: "+91 98765 43210", 
    address: "Vadodara, Gujarat" 
  });
  const [mapUrl, setMapUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false); // <--- Now Dynamic
  const [openTimes, setOpenTimes] = useState("Loading..."); // <--- Shows real hours
  const [copied, setCopied] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", phone: "", message: "", subject: "General Inquiry" });

  // --- LOGIC 1: SMART URL CLEANER ---
  const cleanMapUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    if (rawUrl.includes('<iframe') && rawUrl.includes('src="')) {
      const match = rawUrl.match(/src="([^"]+)"/);
      return match ? match[1] : rawUrl;
    }
    return rawUrl;
  };

  // --- LOGIC 2: FETCH REAL DATA (SETTINGS & SCHEDULE) ---
  useEffect(() => {
    const fetchData = async () => {
      // A. Settings
      const { data: settingsData } = await supabase.from("settings").select("*");
      if (settingsData) {
        const settingsMap: any = {};
        settingsData.forEach(item => { if (item.key) settingsMap[item.key] = item.value; });

        setContactInfo({ 
            email: settingsMap["contact_email"] || "recovery@chillthrive.in", 
            phone: settingsMap["contact_phone"] || "+91 98765 43210", 
            address: settingsMap["contact_address"] || "Vadodara, Gujarat" 
        });
        setMapUrl(cleanMapUrl(settingsMap["map_url"] || ""));
      }

      // B. Smart Schedule Check
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const type = isWeekend ? 'weekend' : 'weekday';

      const { data: scheduleData } = await supabase.from("schedules").select("*").eq("type", type).single();
      
      if (scheduleData) {
          if (scheduleData.is_closed) {
              setIsOpen(false);
              setOpenTimes("Closed Today");
          } else {
              // 1. Set Text Display (e.g., "9:00 AM - 9:00 PM")
              const slots = scheduleData.slots || [];
              if (slots.length > 0) {
                  const first = slots[0];
                  const last = slots[slots.length - 1];
                  // Calculate end time (last slot start + 1 hour)
                  // Simply showing the range of slots available
                  setOpenTimes(`${first} — ${last}`);

                  // 2. Check if OPEN RIGHT NOW
                  let currentHour = now.getHours();
                  const ampm = currentHour >= 12 ? "PM" : "AM";
                  currentHour = currentHour % 12;
                  currentHour = currentHour ? currentHour : 12; // the hour '0' should be '12'
                  const currentSlotString = `${currentHour}:00 ${ampm}`;

                  // If the current hour string exists in the slots array, we are open
                  setIsOpen(slots.includes(currentSlotString));
              } else {
                  setIsOpen(false);
                  setOpenTimes("Unavailable");
              }
          }
      }
    };
    fetchData();
  }, []);

  // --- LOGIC 3: ACTIONS ---
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) { 
        setStatus("error"); 
        setStatusMsg("Phone must be 10 digits"); 
        return; 
    }
    
    setLoading(true); 
    setStatus("sending");
    
    const { error } = await supabase.from("contact_messages").insert([formData]);
    
    if (error) {
        setStatus("error");
        setStatusMsg("Failed to send. Try again.");
    } else { 
        setStatus("success"); 
        setFormData({ name: "", phone: "", message: "", subject: "General Inquiry" }); 
        setTimeout(() => setStatus("idle"), 5000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden selection:bg-blue-200 selection:text-blue-900 font-sans">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-100/50 rounded-full blur-[80px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Smart Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-6">
            <span className={`relative flex h-2 w-2`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {isOpen ? "Support Online" : "Currently Offline"}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">
            REACH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">THE LAB.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Questions about the protocol? Ready to book a group session?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: INFO CARDS */}
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show"
            className="lg:col-span-5 space-y-6"
          >
            {/* 1. Address Card */}
            <motion.div variants={item} className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    {/* MapPin Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">HQ Location</h3>
                 <p className="text-slate-500 leading-relaxed mb-6">{contactInfo.address}</p>
                 
                 {/* Dynamic Map */}
                 <div className="h-40 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                    {mapUrl ? (
                        <iframe 
                          src={mapUrl}
                          className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                          loading="lazy"
                          allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold uppercase">Map Unavailable</div>
                    )}
                 </div>
               </div>
            </motion.div>

            {/* 2. Smart Contact Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Phone */}
               <motion.div 
                 variants={item} 
                 onClick={() => handleCopy(contactInfo.phone, "phone")}
                 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg cursor-pointer group active:scale-95 transition-all"
               >
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                       {/* Phone Icon */}
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    {copied === "phone" ? (
                        <span className="text-green-500 font-bold text-xs">COPIED</span>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-500"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    )}
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Call Us</p>
                 <p className="font-bold text-slate-900">{contactInfo.phone}</p>
               </motion.div>

               {/* Email */}
               <motion.div 
                 variants={item}
                 onClick={() => handleCopy(contactInfo.email, "email")}
                 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg cursor-pointer group active:scale-95 transition-all"
               >
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                       {/* Mail Icon */}
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    {copied === "email" ? (
                         <span className="text-green-500 font-bold text-xs">COPIED</span>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-500"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    )}
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email Us</p>
                 <p className="font-bold text-slate-900 truncate text-sm">{contactInfo.email}</p>
               </motion.div>
            </div>

            {/* 3. Hours */}
            <motion.div variants={item} className="bg-slate-900 p-8 rounded-[2rem] text-white flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Today's Hours</p>
                   <p className="font-bold text-lg">{openTimes}</p>
                </div>
                {/* Clock Icon */}
                <svg className="text-slate-700" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </motion.div>
          </motion.div>


          {/* RIGHT COLUMN: SMART FORM */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white shadow-2xl relative">
               
               {/* Success Overlay */}
               <AnimatePresence>
                 {status === "success" && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center text-center p-12"
                   >
                     <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        {/* Check Icon */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                     </div>
                     <h3 className="text-3xl font-black text-slate-900 mb-2">MESSAGE RECEIVED!</h3>
                     <p className="text-slate-500">We'll get back to you within 24 hours.</p>
                     <button onClick={() => setStatus("idle")} className="mt-8 px-8 py-3 bg-black text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-slate-800">Send Another</button>
                   </motion.div>
                 )}
               </AnimatePresence>

               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Send a Message</h2>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Your Name</label>
                        <input 
                          required
                          className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border border-transparent hover:border-slate-200" 
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Phone</label>
                        <input 
                          required type="tel" maxLength={10}
                          className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border border-transparent hover:border-slate-200" 
                          placeholder="+91 98..."
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Topic</label>
                     <div className="relative">
                        <select 
                          className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer border border-transparent hover:border-slate-200"
                          value={formData.subject}
                          onChange={e => setFormData({...formData, subject: e.target.value})}
                        >
                           <option>General Inquiry</option>
                           <option>Book a Session</option>
                           <option>Membership Plans</option>
                           <option>Partnership</option>
                        </select>
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Message</label>
                     <textarea 
                       required rows={5}
                       className="w-full p-6 bg-slate-50 rounded-2xl font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none border border-transparent hover:border-slate-200 leading-relaxed" 
                       placeholder="How can we help you thrive today?"
                       value={formData.message}
                       onChange={e => setFormData({...formData, message: e.target.value})}
                     />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                       <span className="animate-pulse">Transmitting...</span>
                     ) : (
                       <>
                         <span>Send Transmission</span>
                         {/* Arrow Right Icon */}
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                       </>
                     )}
                  </button>
                  {status === 'error' && <p className="text-center text-red-500 font-bold text-sm mt-4">{statusMsg}</p>}
               </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}