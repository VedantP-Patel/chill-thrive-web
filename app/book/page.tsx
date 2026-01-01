"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000";

// --- TYPES ---
type Variant = { id: string; duration: string; price: number; old_price?: number; active: boolean };
type Service = { 
  id: number; title: string; description: string; type: string; 
  image_url: string; booking_image_url?: string; badge?: string; benefits?: string[];
  capacity: number; variants: Variant[]; is_active: boolean;
};
type Coupon = { code: string; discount_value: number; type: string };

// --- 1. CORE COMPONENT ---
function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('serviceId');

  // --- STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "single" | "combo">("all");
  
  // Selection Logic
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "cash">("qr");
  
  // Form
  const [formData, setFormData] = useState({ 
    name: "", email: "", phone: "", date: "", time: "",
    guests: 1, utr: "", promoCode: ""
  });

  // Logic
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotStatus, setSlotStatus] = useState("Select Date First");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Services & Variants
      const { data: s } = await supabase.from("services").select("*").eq("is_active", true).order("id");
      if (s) {
          // Normalize variants
          const cleaned = s.map((item: any) => ({
             ...item,
             variants: (item.variants && item.variants.length > 0) 
                ? item.variants.filter((v:any) => v.active) 
                : [{ id: 'default', duration: 'Standard', price: item.price, old_price: item.previous_price, active: true }]
          }));
          
          setServices(cleaned);

          // Auto-Select Logic
          if (preSelectedId) {
              const found = cleaned.find((item: Service) => item.id === Number(preSelectedId));
              if (found) handleServiceSelect(found);
              else if (cleaned.length > 0) handleServiceSelect(cleaned[0]);
          } else {
              if (cleaned.length > 0) handleServiceSelect(cleaned[0]);
          }
      }

      // 2. Settings
      const { data: set } = await supabase.from("settings").select("*");
      if (set) {
        const map: any = {};
        set.forEach((item: any) => { map[item.key] = item.value; });
        setAdminSettings(map);
      }
    };
    fetchData();
  }, [preSelectedId]);

  // Helper: Select Service & Default Variant
  const handleServiceSelect = (s: Service) => {
      setSelectedService(s);
      if (s.variants && s.variants.length > 0) {
          setSelectedVariant(s.variants[0]);
      }
      setFormData(prev => ({ ...prev, time: "" })); 
  };

  // --- SMART FILTERING (V4.0) ---
  const filteredServices = services.filter(s => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || s.title.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term);
      
      // Smart Type Filter: 'combo' catches both 'combo' and 'package'
      const matchesType = filterType === "all" 
        ? true 
        : filterType === "combo" 
            ? (s.type === "combo" || s.type === "package") 
            : s.type === filterType;

      return matchesSearch && matchesType;
  });

  // --- COUPON ---
  const handleApplyCoupon = async () => {
    if(!formData.promoCode) return;
    const { data: coupon } = await supabase.from("coupons").select("*").eq("code", formData.promoCode.toUpperCase()).eq("is_active", true).single();
    if (coupon) { setAppliedCoupon(coupon); alert(`✅ ${coupon.code} Applied!`); } 
    else { setAppliedCoupon(null); alert("❌ Invalid Code"); }
  };

  // --- SCHEDULE LOGIC ---
  useEffect(() => {
    const fetchAvailability = async () => {
      setAvailableSlots([]); setIsDayClosed(false); setSlotStatus("Checking..."); 
      
      if (!formData.date || !selectedService) { setSlotStatus("Select Date"); return; }
      
      setLoadingSlots(true);
      try {
          const dateObj = new Date(formData.date);
          const dayType = (dateObj.getDay()===0||dateObj.getDay()===6)?"weekend":"weekday";
          const todayStr = new Date().toLocaleDateString('en-CA');

          const { data: schedules } = await supabase.from("schedules").select("*");
          if (!schedules) return;

          let activeRule = schedules.find(s => s.type === 'custom' && s.date === formData.date);
          if (!activeRule) activeRule = schedules.find(s => s.type === dayType);

          if (!activeRule || activeRule.is_closed) { 
              setIsDayClosed(true); setSlotStatus("⛔ Closed Today"); setLoadingSlots(false); return; 
          }

          let rawSlots = activeRule.slots || [];
          
          if (formData.date === todayStr) {
              const now = new Date();
              const currMins = now.getHours()*60 + now.getMinutes();
              rawSlots = rawSlots.filter((slot: string) => {
                  const [t, m] = slot.split(" "); let [h, mn] = t.split(":").map(Number);
                  if (m==="PM" && h<12) h+=12; if (m==="AM" && h===12) h=0;
                  return (h*60+mn) > currMins;
              });
          }

          const { data: bookings } = await supabase.from("bookings").select("time").eq("booking_date", formData.date).eq("service_type", selectedService.title).neq("status", "cancelled");
          
          if (bookings) {
              const counts: any = {}; bookings.forEach((b: any) => counts[b.time]=(counts[b.time]||0)+1);
              rawSlots = rawSlots.filter((s: string) => (counts[s]||0) < selectedService.capacity);
          }

          setAvailableSlots(rawSlots); 
          setSlotStatus(rawSlots.length>0 ? "" : "Fully Booked");
      } catch (err) { console.error(err); }
      setLoadingSlots(false);
    };
    fetchAvailability();
  }, [formData.date, selectedService]);

  // --- PRICE CALCULATION ---
  const currentPrice = selectedVariant ? selectedVariant.price : 0;
  
  useEffect(() => {
    if (!selectedVariant) return;
    const base = currentPrice * formData.guests;
    let d = 0;
    if (appliedCoupon) {
        d = appliedCoupon.type==='percent' ? Math.round((base*appliedCoupon.discount_value)/100) : appliedCoupon.discount_value;
    }
    setDiscountAmount(d);
  }, [selectedVariant, formData.guests, appliedCoupon, currentPrice]);

  const finalTotal = (currentPrice * formData.guests) - discountAmount;

  // --- SUBMIT ---
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!selectedService) newErrors.service = "Select Service";
    if (!formData.time) newErrors.time = "Select Time";
    if (formData.phone.length !== 10) newErrors.phone = "Invalid Phone";
    if (paymentMethod === 'qr' && formData.utr.length < 4) newErrors.utr = "Enter UTR";
    
    setErrors(newErrors); 
    if(Object.keys(newErrors).length>0) return;

    setLoading(true);
    const { error } = await supabase.from("bookings").insert([{
      service_id: selectedService?.id, 
      service_type: selectedService?.title, 
      duration: selectedVariant?.duration || "Standard", 
      user_name: formData.name, 
      user_email: formData.email, 
      user_phone: formData.phone,
      booking_date: formData.date, 
      time: formData.time, 
      guests: formData.guests,
      status: paymentMethod==='qr'?'payment_review':'pending',
      payment_method: paymentMethod==='qr'?'QR Code':'Pay at Venue',
      transaction_id: formData.utr||"N/A", 
      total_amount: finalTotal,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: discountAmount
    }]);

    if(error) alert(error.message); 
    else { setSuccess(true); window.scrollTo({top:0, behavior:'smooth'}); }
    setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl text-center max-w-md w-full border border-green-100 animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-sm">✓</div>
            <h1 className="text-3xl font-black mb-2">REQUEST SENT!</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">We are verifying your slot.</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-black text-white font-bold rounded-xl uppercase tracking-widest hover:bg-zinc-800 transition-all">Book Another</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-20 pb-32 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* --- LEFT: SEARCH & LIST (SMART V4.0) --- */}
        <div className="lg:col-span-7 flex flex-col h-full lg:h-[calc(100vh-8rem)]">
            
            {/* HEADER */}
            <div className="mb-6 space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-1">PROTOCOL</h1>
                        <p className="text-slate-500 text-sm">Select your recovery session.</p>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                <div className="flex flex-col sm:flex-row gap-3 h-auto sm:h-12">
                    <div className="relative flex-1 h-12 sm:h-full">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full h-full pl-10 pr-4 bg-white border border-zinc-200 rounded-xl font-bold text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    </div>
                    <div className="flex gap-1 h-12 sm:h-full bg-white p-1 rounded-xl border border-zinc-200 shrink-0">
                        {["all", "single", "combo"].map(t => (
                            <button 
                                key={t} 
                                onClick={()=>setFilterType(t as any)} 
                                className={`px-4 h-full rounded-lg text-[10px] font-bold uppercase transition-all ${filterType===t?"bg-black text-white":"text-slate-500 hover:bg-slate-100"}`}
                            >
                                {t === 'combo' ? 'Combos' : t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SERVICE LIST */}
            <div className="flex-1 overflow-y-auto p-4 -m-4 space-y-4 custom-scrollbar">
                {filteredServices.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 border-2 border-dashed rounded-3xl">No services found.</div>
                ) : (
                    filteredServices.map((s) => {
                        // Smart Price Display
                        const minPrice = s.variants?.length ? Math.min(...s.variants.map(v => v.price)) : 0;
                        const activeVariant = s.variants && s.variants[0];

                        return (
                            <div key={s.id} onClick={() => handleServiceSelect(s)} 
                                className={`group relative bg-white rounded-[2rem] p-4 cursor-pointer transition-all duration-300 ease-out border-2 ${
                                    selectedService?.id===s.id 
                                    ? "border-blue-600 shadow-2xl shadow-blue-100 scale-[1.01] z-10" 
                                    : "border-transparent hover:border-zinc-200 hover:shadow-lg"
                                }`}
                            >
                                {/* SMART BADGE */}
                                {s.badge && <span className="absolute top-6 left-6 z-20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">{s.badge}</span>}
                                
                                <div className="flex flex-col sm:flex-row gap-5">
                                    <div className="w-full sm:w-40 h-40 rounded-2xl bg-gray-100 shrink-0 overflow-hidden relative">
                                        <img src={s.booking_image_url || s.image_url || FALLBACK_IMG} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e)=>(e.target as HTMLImageElement).src=FALLBACK_IMG} />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center py-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-black text-xl md:text-2xl leading-none">{s.title}</h3>
                                                <div className="text-right">
                                                    <span className="block text-xl md:text-2xl font-black text-blue-600">
                                                        {s.variants.length > 1 && <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">From</span>}
                                                        ₹{minPrice}
                                                    </span>
                                                    {activeVariant?.old_price && activeVariant.old_price > activeVariant.price && (
                                                        <span className="text-xs text-slate-400 line-through font-medium">₹{activeVariant.old_price}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-3 line-clamp-2">{s.description}</p>
                                            
                                            {/* SMART BENEFITS TAGS */}
                                            {s.benefits && s.benefits.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-auto">
                                                    {s.benefits.slice(0, 3).map((b, i) => (
                                                        <span key={i} className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                                                            ✓ {b}
                                                        </span>
                                                    ))}
                                                    {s.benefits.length > 3 && (
                                                        <span className="text-[9px] font-bold uppercase bg-slate-50 text-slate-400 px-2 py-1 rounded">+{s.benefits.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
                
        {/* --- RIGHT: BILLING & FORM (V4.0) --- */}
        <div className="lg:col-span-5">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 lg:sticky lg:top-24">
                
                {/* 1. DYNAMIC SUMMARY CARD */}
                <div className="mb-8 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/40 transition-all"></div>
                    
                    <h2 className="font-black text-[10px] tracking-[0.3em] mb-6 text-slate-500 uppercase">Billing Summary</h2>

                    {selectedService && selectedVariant ? (
                        <div className="space-y-5">
                            {/* Selected Protocol */}
                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                                <div>
                                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                                    <span className="font-bold text-lg tracking-tighter leading-none">{selectedService.title}</span>
                                </div>
                            </div>

                            {/* DYNAMIC VARIANT SELECTOR */}
                            <div>
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Duration / Plan</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedService.variants.map((v) => (
                                        <button 
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                                                selectedVariant.id === v.id 
                                                ? "bg-white text-black border-white" 
                                                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"
                                            }`}
                                        >
                                            <div className="text-xs font-black uppercase z-10 relative">{v.duration}</div>
                                            <div className="text-[10px] z-10 relative">₹{v.price}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="pt-5 border-t border-slate-800 mt-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="block text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Total Payable</span>
                                        <span className="text-4xl font-black tracking-tighter text-white">₹{finalTotal}</span>
                                        {selectedVariant.old_price && selectedVariant.old_price > selectedVariant.price && (
                                            <span className="ml-2 text-sm text-slate-500 line-through">₹{selectedVariant.old_price * formData.guests}</span>
                                        )}
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-green-400 uppercase block tracking-widest">Coupon Applied</span>
                                            <span className="text-sm font-bold text-white">- ₹{discountAmount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Initialize Selection</p>
                        </div>
                    )}
                </div>

                {/* 2. BOOKING FORM */}
                <form onSubmit={handleBooking} className="space-y-4">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Date</label>
                            <input type="date" min={new Date().toISOString().split("T")[0]} className="w-full h-12 px-3 bg-zinc-50 rounded-xl font-bold outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Time</label>
                            <select className={`w-full h-12 px-3 rounded-xl font-bold outline-none text-sm bg-zinc-50 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all ${errors.time?"ring-2 ring-red-100":""}`} value={formData.time} onChange={(e)=>setFormData({...formData, time: e.target.value})} disabled={!formData.date||loadingSlots||isDayClosed||availableSlots.length===0}>
                                {loadingSlots ? <option>Checking...</option> : availableSlots.length > 0 ? <option value="">Select Slot</option> : <option>{slotStatus}</option>}
                                {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Promo Code */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Promo Code</label>
                        <div className="flex gap-2 h-12">
                            <input className="flex-1 h-full px-4 bg-zinc-50 rounded-xl font-bold outline-none text-sm uppercase focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:normal-case" placeholder="Enter Code" value={formData.promoCode} onChange={e=>setFormData({...formData, promoCode:e.target.value})} />
                            <button type="button" onClick={handleApplyCoupon} className="px-6 bg-black text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all">APPLY</button>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-3 pt-2">
                        <input className="w-full h-12 px-4 bg-zinc-50 rounded-xl font-bold outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" placeholder="FULL NAME" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                        <div className="grid grid-cols-2 gap-3">
                            <input className="w-full h-12 px-4 bg-zinc-50 rounded-xl font-bold outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" type="tel" maxLength={10} placeholder="PHONE" required value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value.replace(/\D/g,"")})} />
                            <input className="w-full h-12 px-4 bg-zinc-50 rounded-xl font-bold outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" type="email" placeholder="EMAIL" required value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="pt-4 border-t border-dashed border-zinc-200">
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            <button type="button" onClick={()=>setPaymentMethod("qr")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${paymentMethod==="qr"?"bg-white shadow-md text-blue-600":"text-slate-400"}`}>UPI / QR</button>
                            <button type="button" onClick={()=>setPaymentMethod("cash")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${paymentMethod==="cash"?"bg-white shadow-md text-green-600":"text-slate-400"}`}>Pay at Venue</button>
                        </div>
                        {paymentMethod === 'qr' && (
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
                                <div className="bg-white p-2 rounded-lg inline-block shadow-sm mb-2">
                                    <img src={adminSettings.upi_qr || FALLBACK_IMG} className="w-24 h-24 object-contain" alt="QR" />
                                </div>
                                <input className={`w-full p-3 text-center text-sm font-bold bg-white border rounded-lg outline-none tracking-widest ${errors.utr?"border-red-500":"border-blue-200"}`} placeholder="ENTER UTR / REF ID" value={formData.utr} onChange={e=>setFormData({...formData, utr:e.target.value})} />
                            </div>
                        )}
                    </div>

                    {/* Floating Submit (Mobile) / Static (Desktop) */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-zinc-200 md:static md:bg-transparent md:border-0 md:p-0 z-50">
                        <button 
                            type="submit"
                            disabled={loading} 
                            className="w-full py-4 bg-black text-white font-black rounded-2xl uppercase shadow-xl hover:bg-zinc-800 disabled:opacity-50 text-sm md:text-base transition-all active:scale-[0.98]"
                        >
                            {loading ? "Processing..." : `Confirm • ₹${finalTotal}`}
                        </button>
                    </div>
                </form> 
            </div> 
        </div> 
      </div> 
    </div>
  );
}

// 2. THE WRAPPER
export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 font-black uppercase tracking-widest text-[10px]">Buffer Loading...</div>}>
      <BookingContent />
    </Suspense>
  );
}