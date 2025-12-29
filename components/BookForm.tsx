"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Service {
  id: number;
  title: string;
  price: number;
  price_30: number | null;
  previous_price: number | null;
  previous_price_30: number | null;
  image_url: string;
  booking_image_url: string;
  capacity: number;
}

interface BookFormProps { services: Service[]; qrCodeUrl: string; }

export default function BookForm({ services, qrCodeUrl }: BookFormProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [duration, setDuration] = useState<"30" | "60">("60");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // States
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [displayImg, setDisplayImg] = useState<string>("https://placehold.co/600x800?text=Select+Service");
  const [nextImg, setNextImg] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pay at Shop");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  const todayStr = new Date().toISOString().split("T")[0];

  // Pricing Helpers
  const currentPrice = selectedService 
    ? duration === "60" ? selectedService.price : (selectedService.price_30 || Math.round(selectedService.price * 0.6))
    : 0;

  const oldPrice = selectedService
    ? duration === "60" ? selectedService.previous_price : selectedService.previous_price_30
    : null;

  // Visual Transition
  const handleServiceSelect = (s: Service) => {
    if (selectedService?.id === s.id) return;
    setSelectedService(s);
    const newUrl = s.booking_image_url || s.image_url || "https://placehold.co/600x800?text=Select+Service";
    
    setNextImg(newUrl);
    setIsTransitioning(true);
    setTimeout(() => {
        setDisplayImg(newUrl);
        setIsTransitioning(false);
        setNextImg(null);
    }, 500);
  };

  // Availability Logic
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsDayClosed(false);
      setAvailableSlots([]);
      setTime("");

      if (!date || !selectedService) return;

      const dateObj = new Date(date);
      const dayType = (dateObj.getDay() === 0 || dateObj.getDay() === 6) ? "weekend" : "weekday";
      
      const { data: schedules } = await supabase.from("schedules").select("*")
        .or(`type.eq.custom,type.eq.${dayType}`)
        .or(`service_id.eq.${selectedService.id},service_id.is.null`);

      if (!schedules) return;

      const findRule = (type: string, dateMatch: string | null, sId: number | null) => 
         schedules.find(r => r.type === type && r.date === dateMatch && r.service_id === sId);

      const rule = findRule("custom", date, selectedService.id) || 
                   findRule("custom", date, null) || 
                   findRule(dayType, null, selectedService.id) || 
                   findRule(dayType, null, null);

      if (rule && rule.is_closed) {
          setIsDayClosed(true);
          return;
      }

      if (!rule) return;

      let rawSlots = rule.slots || [];

      // Remove Booked Slots
      const { data: bookings } = await supabase.from("bookings").select("time, duration")
        .eq("booking_date", date).eq("service_id", selectedService.id).neq("status", "cancelled");
      
      const bookedCounts: Record<string, number> = {};
      const toMins = (t: string) => { const [timePart, mod] = t.split(" "); let [h, m] = timePart.split(":").map(Number); if (mod === "PM" && h < 12) h += 12; if (mod === "AM" && h === 12) h = 0; return h * 60 + m; };

      if (bookings) {
        bookings.forEach(b => {
            const startMins = toMins(b.time); 
            const durationMins = parseInt(b.duration) || 60; 
            const endMins = startMins + durationMins;
            
            rawSlots.forEach((slot: string) => { 
                const slotStart = toMins(slot); 
                if (slotStart >= startMins && slotStart < endMins) { 
                    bookedCounts[slot] = (bookedCounts[slot] || 0) + 1; 
                } 
            });
        });
      }

      const capacity = selectedService.capacity || 1;
      let finalSlots = rawSlots.filter((slot: string) => (bookedCounts[slot] || 0) < capacity);

      if (date === todayStr) {
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        finalSlots = finalSlots.filter((s: string) => toMins(s) > nowMins);
      }
      setAvailableSlots(finalSlots);
    };
    fetchAvailability();
  }, [date, selectedService, todayStr]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDATION START ---
    
    // 1. Phone Validation
    if (phone.length !== 10) { 
        setStatus("Error: Phone must be exactly 10 digits."); 
        return; 
    }

    // 2. Email Validation (Regex for strict format: name@domain.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setStatus("Error: Please enter a valid email address.");
        return;
    }

    // 3. Payment UTR Validation
    if (paymentMethod === "QR Code" && transactionId.length < 4) { 
        setStatus("Error: Please enter valid Payment Ref/UTR."); 
        return; 
    }
    
    // --- VALIDATION END ---

    setLoading(true); 
    setStatus("Processing...");
    
    const { error } = await supabase.from("bookings").insert([{ 
        service_id: selectedService?.id, 
        service_type: selectedService?.title, 
        user_name: name, 
        user_email: email, 
        user_phone: phone, 
        booking_date: date, 
        time: time, 
        duration: duration + " min", 
        payment_method: paymentMethod, 
        transaction_id: transactionId, 
        status: paymentMethod === "QR Code" ? "payment_review" : "pending" 
    }]);

    if (error) { setStatus(`Error: ${error.message}`); setLoading(false); }
    else { setStatus("Confirmed!"); setTimeout(() => router.push("/track"), 2000); }
  };

  return (
    <div className="max-w-6xl w-full bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[800px] border border-slate-100">
        
        {/* LEFT PANEL */}
        <div className="relative w-full md:w-5/12 h-72 md:h-full text-white flex flex-col justify-end p-6 md:p-10 bg-blue-950 overflow-hidden shrink-0 group">
          <div className="absolute inset-0 z-0"><Image src={displayImg} alt="Bg" fill className="object-cover opacity-80 transition-transform duration-[2000ms] group-hover:scale-105" unoptimized priority /></div>
          <div className={`absolute inset-0 z-10 transition-opacity duration-500 ease-in-out ${isTransitioning ? "opacity-100" : "opacity-0"}`}>{nextImg && <Image src={nextImg} alt="Bg Next" fill className="object-cover opacity-80" unoptimized priority />}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent z-20 pointer-events-none"></div>

          <div className="relative z-30 space-y-4 md:space-y-6">
            <div key={selectedService?.id || 'empty'} className="animate-fade-in-up">
                {!selectedService ? (
                   <div>
                       <h2 className="text-3xl md:text-4xl font-light mb-1 md:mb-2 tracking-tighter text-white">INITIALIZE</h2>
                       <p className="text-blue-200 font-mono text-[10px] md:text-xs tracking-widest uppercase">Select Protocol to Begin</p>
                   </div>
                ) : (
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 mb-2 font-bold hidden md:block">Protocol Active</p>
                        <h2 className="text-3xl md:text-4xl font-black leading-none mb-4 md:mb-6 text-white tracking-tighter shadow-black drop-shadow-md">{selectedService.title}</h2>
                        
                        <div className="bg-white/10 p-4 md:p-6 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                            <div className="flex justify-between items-center mb-2 md:mb-4 pb-2 md:pb-4 border-b border-white/10">
                                <div><p className="text-[10px] text-blue-100 uppercase font-bold tracking-wider mb-1">Duration</p><p className="font-mono text-base md:text-lg text-white">{duration} MIN</p></div>
                                <div className="text-right">
                                   <p className="text-[10px] text-blue-100 uppercase font-bold tracking-wider mb-1">Investment</p>
                                   <div className="flex flex-col items-end leading-none">
                                       {oldPrice && <span className="text-[10px] md:text-xs text-red-400 line-through font-extrabold decoration-red-500 decoration-2 mb-1 bg-white/10 px-1 rounded">₹{oldPrice}</span>}
                                       <p className="text-2xl md:text-3xl font-black text-white">₹{currentPrice}</p>
                                   </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-2 h-2"><div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div><div className="relative w-2 h-2 bg-white rounded-full"></div></div>
                                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Capacity: {selectedService.capacity}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 md:p-10 w-full md:w-7/12 bg-white text-slate-900 md:overflow-y-auto custom-scrollbar">
          <form onSubmit={handleBooking} className="space-y-6 md:space-y-8 h-full flex flex-col">
            
            <div>
               <label className="block text-[10px] font-bold uppercase text-slate-400 mb-3 md:mb-4 tracking-widest">Select Protocol</label>
               <div className="grid grid-cols-1 gap-2 md:gap-3">
                 {services.map((s) => (
                   <button key={s.id} type="button" onClick={() => handleServiceSelect(s)} className={`relative p-3 md:p-4 rounded-xl border text-left transition-all duration-300 ease-out flex justify-between items-center group overflow-hidden ${selectedService?.id === s.id ? "border-blue-500 bg-blue-50 shadow-md scale-[1.01] md:scale-[1.02]" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}>
                     <div className="relative z-10"><span className={`block font-bold text-xs md:text-sm transition-colors ${selectedService?.id === s.id ? "text-blue-900":"text-slate-600"}`}>{s.title}</span></div>
                     <div className="relative z-10 text-right">
                        {s.previous_price && <span className="block text-[10px] text-red-500 line-through font-bold decoration-red-500">₹{s.previous_price}</span>}
                        <span className={`text-xs md:text-sm font-mono font-bold ${selectedService?.id === s.id ? "text-blue-600":"text-slate-500"}`}>₹{s.price}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>

            <div className={`space-y-6 transition-all duration-500 ease-out ${selectedService ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 pointer-events-none grayscale"}`}>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                     <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Duration</label><div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">{["30", "60"].map((d) => (<button key={d} type="button" onClick={() => setDuration(d as "30"|"60")} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-300 ${duration === d ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>{d} MIN</button>))}</div></div>
                     <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Date</label><input type="date" min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium" required /></div>
                </div>

                {isDayClosed ? (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center animate-pulse">
                       <p className="text-red-600 font-bold text-sm uppercase tracking-wider">⛔ Facility Closed</p>
                       <p className="text-red-400 text-xs mt-1">Please select another date.</p>
                   </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Available Slot</label>
                        <div className="relative">
                            <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!date} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50 transition-all" required>
                                <option value="">{availableSlots.length>0 ? `Select from ${availableSlots.length} available slots` : date ? "-- No Slots Available --" : "-- Select Date First --"}</option>
                                {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</div>
                        </div>
                    </div>
                )}

                <div className="space-y-4 pt-2 border-t border-slate-100">
                    <input type="text" placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-transparent border-b-2 border-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors uppercase tracking-wide font-bold" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* EMAIL INPUT WITH VALIDATION */}
                        <input 
                            type="email" 
                            placeholder="EMAIL" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full p-3 bg-transparent border-b-2 border-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors uppercase tracking-wide font-bold" 
                            required 
                        />
                        <input type="tel" placeholder="PHONE (10 Digits)" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/,''))} className="w-full p-3 bg-transparent border-b-2 border-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors font-mono font-bold" required />
                    </div>
                </div>
            </div>

            <div className={`mt-auto pt-6 border-t border-slate-100 transition-all duration-700 ${selectedService ? "opacity-100" : "opacity-0"}`}>
               <div className="flex gap-3 md:gap-4 mb-6">{["Pay at Shop", "QR Code"].map(m => (<button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === m ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>{m}</button>))}</div>
               
               {paymentMethod === "QR Code" && (
                   <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-5 items-center mb-6 animate-fade-in-up">
                       <div className="w-16 h-16 md:w-20 md:h-20 relative bg-white border border-slate-200 p-1 rounded shrink-0"><Image src={qrCodeUrl} alt="QR" fill className="object-contain" unoptimized /></div>
                       <div className="flex-1 space-y-2">
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Scan & Paste UTR</p>
                           <input type="text" placeholder="Paste UPI Ref ID (12 Digits)" maxLength={20} value={transactionId} onChange={e => setTransactionId(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded text-slate-900 font-mono text-sm focus:border-blue-500 outline-none uppercase" />
                           <p className="text-[10px] text-slate-400">*Copy from GPay/PhonePe and paste here.</p>
                       </div>
                   </div>
               )}

               <button type="submit" disabled={loading || !selectedService || !time} className="group w-full relative overflow-hidden bg-black text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest hover:bg-zinc-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"><span className="relative z-10">{loading ? "Initializing..." : `Confirm • ₹${currentPrice}`}</span></button>
               {status && <p className="text-center text-[10px] font-bold text-red-500 mt-3 animate-pulse uppercase tracking-widest">{status}</p>}
            </div>
          </form>
        </div>
        
        <style jsx global>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }`}</style>
    </div>
  );
}