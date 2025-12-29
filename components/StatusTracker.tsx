"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StatusTracker() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) { setMsg("Enter valid 10-digit phone."); return; }
    if (!email.includes("@")) { setMsg("Enter valid email."); return; }
    
    setLoading(true); setMsg(""); setStatus(null);
    
    // Fetch booking matching BOTH Phone AND Email
    const { data, error } = await supabase
      .from("bookings")
      .select("status, booking_date, time, service_type")
      .eq("user_phone", phone)
      .eq("user_email", email) // <--- SECURITY CHECK
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      setMsg("No booking found matching these details.");
    } else {
      setStatus(data);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Track Session Status</h3>
      <p className="text-zinc-500 text-sm mb-6">Enter your registered email and phone number.</p>
      
      <form onSubmit={checkStatus} className="flex flex-col md:flex-row gap-3 mb-6">
        <input 
          type="email" 
          placeholder="email@example.com" 
          className="flex-1 bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-700 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="tel" 
          placeholder="Phone (10 digits)" 
          className="flex-1 bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-700 font-mono text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/,''))}
          maxLength={10}
          required
        />
        <button 
          disabled={loading}
          className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 uppercase text-xs tracking-wider"
        >
          {loading ? "..." : "Track"}
        </button>
      </form>

      {/* Result Display */}
      {msg && <p className="text-red-400 text-xs font-mono text-center">{msg}</p>}
      
      {status && (
        <div className="bg-black/50 p-6 rounded-lg border border-zinc-800 animate-fade-in-up flex justify-between items-center">
            <div>
                <p className="text-white font-bold text-lg mb-1">{status.service_type}</p>
                <p className="text-zinc-500 text-sm font-mono">{status.booking_date} • {status.time}</p>
            </div>
            <div className="text-right">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1">Current Status</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider ${
                    status.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    status.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                    {status.status === 'payment_review' ? 'Verifying' : status.status}
                </span>
            </div>
        </div>
      )}
    </div>
  );
}