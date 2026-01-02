"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Phone, Mail, RefreshCw, AlertCircle, Clock, 
    PhoneCall, CheckCircle2, XCircle, Calendar, 
    CreditCard, User, Activity, ArrowRight, Zap, ShieldCheck
} from "lucide-react";

// --- ANIMATION CONFIG ---
const containerVar = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const cardEntryVar = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// --- STATUS STEPS ---
const STEPS = [
  { id: 0, label: "Verifying", desc: "Checking payment" },
  { id: 1, label: "Confirmed", desc: "Slot secured" },
  { id: 2, label: "Active", desc: "Session live" },
  { id: 3, label: "Completed", desc: "Recovery done" },
];

export default function TrackPage() {
  const [formData, setFormData] = useState({ email: "", phone: "" });
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // --- LOGIC ---
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.phone) return setError("Please enter registered details.");
    
    setLoading(true); setError(""); setBooking(null); setIsUrgent(false);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_email", formData.email)
      .eq("user_phone", formData.phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
        setError("No booking found. Please check spelling.");
    } else {
        setTimeout(() => {
            setBooking(data);
            const s = (data.status || "").toLowerCase();
            // Check Urgency: Pending/Confirmed AND < 2 hours to start
            if (!['in_progress', 'active', 'completed', 'done', 'cancelled'].includes(s)) {
                 try {
                     const bookDate = new Date(`${data.booking_date} ${data.time}`);
                     if ((bookDate.getTime() - Date.now()) / 36e5 < 2) setIsUrgent(true);
                 } catch(e){}
            }
        }, 600);
    }
    setLoading(false);
  };

  // --- STEP CALCULATOR ---
  const getStep = (b: any) => {
      const s = (b.status || "").toLowerCase().trim();
      if (s.includes('cancel') || s.includes('reject')) return -1;
      if (s.includes('complete') || s.includes('done')) return 3;
      if (s.includes('progress') || s.includes('active')) return 2;
      if (s.includes('confirm')) {
          try { if (new Date() >= new Date(`${b.booking_date} ${b.time}`)) return 2; } catch(e){}
          return 1;
      }
      return 0;
  };

  const currentStep = booking ? getStep(booking) : 0;
  const isCancelled = currentStep === -1;
  const isActive = currentStep === 2;

  // Decide when to show helpline (Smart Logic)
  const showHelpline = isUrgent || error || isCancelled;

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans text-slate-900 flex flex-col pt-32 pb-12 px-6 lg:px-12">
      
      {/* 🌌 BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-100/60 rounded-full blur-[100px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <motion.div 
        variants={containerVar} initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
      >
        
        {/* --- LEFT: SEARCH (Sticky) --- */}
        <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg shadow-blue-100/50 mb-6 text-blue-600 border border-blue-50">
                    <Search size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                    TRACK <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">SESSION.</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    Locate your active recovery protocol status.
                </p>
            </div>

            <form onSubmit={handleTrack} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/60 relative overflow-hidden">
                <div className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="email" placeholder="Registered Email" 
                            className="w-full h-16 pl-14 pr-4 bg-slate-50/50 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400 shadow-inner"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="tel" placeholder="Registered Phone" 
                            className="w-full h-16 pl-14 pr-4 bg-slate-50/50 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400 shadow-inner"
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <button 
                        disabled={loading}
                        className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-300/50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : <>Find Booking <ArrowRight size={18}/></>}
                    </button>
                </div>
                
                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 p-4 bg-red-50 text-red-500 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 border border-red-100">
                            <AlertCircle size={14}/> {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
            
            {/* 🚨 SMART HELPLINE (Only Shows when needed) */}
            <AnimatePresence>
                {showHelpline && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-full text-amber-600 shadow-sm"><PhoneCall size={18}/></div>
                             <div>
                                 <p className="text-[10px] font-black uppercase text-amber-500">Urgent Assistance</p>
                                 <p className="text-sm font-bold text-slate-900">+91 98765 43210</p>
                             </div>
                        </div>
                        <a href="tel:+919876543210" className="px-4 py-2 bg-white text-amber-600 text-xs font-bold rounded-xl shadow-sm hover:bg-amber-600 hover:text-white transition-colors">Call</a>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- RIGHT: RESULT CARD --- */}
        <div className="lg:col-span-7 pt-4 lg:pt-0">
            <AnimatePresence mode="wait">
                {booking ? (
                    <motion.div 
                        key={booking.id}
                        variants={cardEntryVar}
                        initial="hidden" animate="visible" exit="hidden"
                        className="bg-white/90 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[500px]"
                    >
                        {/* Status Strip */}
                        {isUrgent && (
                            <div className="bg-amber-400 text-black p-3 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                                ⚠ Priority: Session Starts Soon
                            </div>
                        )}

                        {/* Card Content */}
                        <div className="p-8 md:p-10 relative">
                             {/* Floating Glow */}
                             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                             <div className="flex justify-between items-start mb-8">
                                 <div>
                                     <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-3">
                                        <ShieldCheck size={10} /> ID: {String(booking.id).split('-')[0]}
                                     </span>
                                     <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-none tracking-tight">
                                        {booking.service_type}
                                     </h2>
                                 </div>
                                 
                                 {/* Status Badge */}
                                 <motion.div 
                                    animate={isActive ? { scale: [1, 1.05, 1], boxShadow: "0 0 20px rgba(37, 99, 235, 0.2)" } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border flex items-center gap-2 shadow-sm whitespace-nowrap ${
                                        isCancelled ? "bg-red-50 border-red-100 text-red-600" : 
                                        isActive ? "bg-blue-600 border-blue-600 text-white" : 
                                        currentStep === 3 ? "bg-green-100 border-green-200 text-green-700" :
                                        "bg-amber-50 border-amber-100 text-amber-600"
                                    }`}
                                 >
                                     {isActive && <Zap size={12} fill="currentColor" />}
                                     {isCancelled ? "Cancelled" : isActive ? "Live Now" : booking.status.replace('_', ' ')}
                                 </motion.div>
                             </div>
                             
                             {/* Progress Bar */}
                             {!isCancelled ? (
                                <div className="relative py-8 mb-4">
                                    <div className="absolute top-1/2 left-0 w-full h-2.5 bg-slate-100 rounded-full -translate-y-1/2 -z-10"></div>
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${(currentStep / 3) * 100}%` }} 
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="absolute top-1/2 left-0 h-2.5 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full -translate-y-1/2 -z-10 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                                    />
                                    <div className="flex justify-between relative">
                                        {STEPS.map((step) => {
                                            const isDone = step.id <= currentStep;
                                            const isCurrent = step.id === currentStep;
                                            return (
                                                <div key={step.id} className="flex flex-col items-center gap-3 w-16 md:w-20">
                                                    <motion.div 
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.3 + (step.id * 0.1) }}
                                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-all bg-white z-10 ${
                                                            isDone ? "border-blue-500 text-blue-600 shadow-md" : "border-slate-100 text-slate-300"
                                                        } ${isCurrent && isActive ? "ring-4 ring-blue-100 scale-110 shadow-lg shadow-blue-200" : ""}`}
                                                    >
                                                        {isDone ? <CheckCircle2 size={20} /> : step.id + 1}
                                                    </motion.div>
                                                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider text-center transition-opacity duration-500 ${isDone ? "text-slate-900 opacity-100" : "text-slate-300 opacity-60"}`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                             ) : (
                                <div className="bg-red-50 p-6 rounded-2xl text-center border border-red-100 my-8">
                                     <XCircle className="mx-auto text-red-400 mb-2" size={32} />
                                     <h3 className="font-bold text-red-900 text-sm">Booking Cancelled</h3>
                                     <p className="text-red-500 text-xs mt-1">This session was marked as cancelled.</p>
                                 </div>
                             )}
                        </div>

                        {/* Info Grid */}
                        <div className="bg-slate-50/80 border-t border-slate-200/50 p-8 md:p-10 grid grid-cols-2 gap-8 md:gap-12">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                    <Calendar size={14}/> Date & Time
                                </div>
                                <p className="font-bold text-slate-900 text-sm md:text-base">{booking.booking_date}</p>
                                <p className="text-xs font-medium text-slate-500">{booking.time}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                    <User size={14}/> Guests
                                </div>
                                <p className="font-bold text-slate-900 text-sm md:text-base">{booking.guests} Person(s)</p>
                                <p className="text-xs font-medium text-slate-500">{booking.duration}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                    <CreditCard size={14}/> Paid
                                </div>
                                <p className="font-bold text-slate-900 text-sm md:text-base">₹{booking.total_amount}</p>
                                <p className="text-xs font-medium text-slate-500 uppercase">{booking.payment_method}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                    <Activity size={14}/> Status
                                </div>
                                <p className="font-bold text-slate-900 text-sm md:text-base capitalize">{booking.status.replace('_', ' ')}</p>
                                <p className="text-xs font-medium text-slate-500">Live Update</p>
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <div className="hidden lg:flex h-full min-h-[600px] items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/30 text-center">
                        <div>
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm animate-pulse">
                                <Search size={40} />
                            </div>
                            <h3 className="font-bold text-slate-400 text-xl">Ready to Track</h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                                Enter your details on the left to view your live session status, timeline, and receipt.
                            </p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}