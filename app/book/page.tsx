"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Calendar, Clock, Users, ChevronRight, 
  CreditCard, Sparkles, Receipt, CheckCircle2, 
  Copy, Minus, Plus, ArrowRight, Tag 
} from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000";

// --- TYPES ---
type Variant = { id: string; duration: string; price: number; old_price?: number; active: boolean };
type Service = { 
  id: number; title: string; description: string; type: string; 
  image_url: string; booking_image_url?: string; badge?: string; benefits?: string[];
  capacity: number; variants: Variant[]; is_active: boolean;
};
type Coupon = { code: string; discount_value: number; type: string };

// --- CORE COMPONENT ---
function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('serviceId');

  // --- STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "single" | "combo">("all");
  
  // Selection
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
  const [slotStatus, setSlotStatus] = useState("Select Date");
  const [loading, setLoading] = useState(false);
  
  // Success
  const [success, setSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  // --- FETCH DATA (ROBUST V6.0) ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Services (No Filters to ensure data loads)
      const { data: s } = await supabase.from("services").select("*").order("id");
      
      if (s && s.length > 0) {
          const cleaned = s.map((item: any) => {
             // Safe Variant Parsing
             let safeVariants = [];
             if (Array.isArray(item.variants)) safeVariants = item.variants;
             else if (typeof item.variants === 'string') try { safeVariants = JSON.parse(item.variants); } catch(e){}
             
             if (!safeVariants || safeVariants.length === 0) {
                 safeVariants = [{ id: 'def', duration: 'Standard', price: item.price || 0, active: true }];
             }

             return { ...item, variants: safeVariants };
          });
          setServices(cleaned);
          
          if (preSelectedId) {
              const found = cleaned.find((i: Service) => i.id === Number(preSelectedId));
              if (found) handleServiceSelect(found);
              else handleServiceSelect(cleaned[0]);
          } else {
              if (!selectedService) handleServiceSelect(cleaned[0]);
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
  }, []);

  const handleServiceSelect = (s: Service) => {
      setSelectedService(s);
      if (s.variants?.length > 0) setSelectedVariant(s.variants[0]);
      setFormData(prev => ({ ...prev, time: "" })); 
  };

  // --- FILTER ---
  const filteredServices = services.filter(s => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || s.title.toLowerCase().includes(term);
      const matchesType = filterType === "all" ? true : filterType === "combo" ? (s.type === "combo" || s.type === "package") : s.type === filterType;
      return matchesSearch && matchesType;
  });

  // --- COUPON ---
  const handleApplyCoupon = async () => {
    if(!formData.promoCode) return;
    const { data: coupon } = await supabase.from("coupons").select("*").eq("code", formData.promoCode.toUpperCase()).eq("is_active", true).single();
    if (coupon) { setAppliedCoupon(coupon); alert(`✅ ${coupon.code} Applied!`); } 
    else { setAppliedCoupon(null); alert("❌ Invalid Code"); }
  };

  // --- SLOTS LOGIC ---
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

  // --- CALCULATIONS ---
  const basePrice = selectedVariant ? selectedVariant.price : 0;
  const subTotal = basePrice * formData.guests;
  
  useEffect(() => {
    let d = 0;
    if (appliedCoupon) {
        d = appliedCoupon.type==='percent' ? Math.round((subTotal*appliedCoupon.discount_value)/100) : appliedCoupon.discount_value;
    }
    setDiscountAmount(d);
  }, [subTotal, appliedCoupon]);

  const finalTotal = subTotal - discountAmount;

  // --- SUBMIT ---
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formData.date || !formData.time) return alert("Please complete all details");
    if (formData.phone.length !== 10) return alert("Phone must be 10 digits");
    if (paymentMethod === 'qr' && formData.utr.length < 4) return alert("Please enter valid UTR");

    setLoading(true);
    const { data: newBooking, error } = await supabase.from("bookings").insert([{
      service_id: selectedService?.id, 
      service_type: selectedService?.title, 
      duration: selectedVariant?.duration || "Standard", 
      user_name: formData.name, user_email: formData.email, user_phone: formData.phone,
      booking_date: formData.date, time: formData.time, guests: formData.guests,
      status: paymentMethod==='qr'?'payment_review':'pending',
      payment_method: paymentMethod==='qr'?'QR Code':'Pay at Venue',
      transaction_id: formData.utr||"N/A", 
      total_amount: finalTotal,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: discountAmount
    }]).select().single();

    if(error) alert(error.message); 
    else { 
        if(newBooking) setConfirmedBookingId(newBooking.id);
        setSuccess(true); window.scrollTo({top:0, behavior:'smooth'}); 
    }
    setLoading(false);
  };

  // --- SUCCESS SCREEN ---
  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border border-green-100">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-5xl mb-6 shadow-sm">
                <CheckCircle2 size={48} />
            </div>
            <h1 className="text-3xl font-black mb-2 text-slate-900">BOOKED!</h1>
            <p className="text-slate-500 mb-8 font-medium">Your session is secured.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 flex items-center justify-between relative overflow-hidden">
                <div className="text-left z-10">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Booking ID</p>
                    <p className="font-mono font-bold text-slate-900 text-lg">{confirmedBookingId}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(confirmedBookingId); alert("Copied!"); }} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-blue-600 transition-colors active:scale-95 z-10">
                    <Copy size={20} />
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <button onClick={() => router.push('/track')} className="w-full py-4 bg-black text-white font-bold rounded-2xl uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg">Track Status</button>
                <button onClick={() => window.location.reload()} className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl uppercase tracking-widest hover:bg-slate-50 transition-all">New Booking</button>
            </div>
        </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-24 pb-32 px-4 md:px-8 selection:bg-blue-200 selection:text-blue-900">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* --- LEFT: CATALOG --- */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
            <div className="mb-8">
                <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl md:text-6xl font-black tracking-tighter mb-2">
                    SELECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">PROTOCOL.</span>
                </motion.h1>
                
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border-none shadow-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Find your recovery..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm h-14 w-fit">
                        {["all", "single", "combo"].map(t => (
                            <button key={t} onClick={()=>setFilterType(t as any)} className={`px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType===t?"bg-black text-white shadow-md":"text-slate-400 hover:bg-slate-50"}`}>
                                {t === 'combo' ? 'Combos' : t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Service Grid (Simple Animation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
                {filteredServices.map(s => {
                    const minPrice = s.variants?.length ? Math.min(...s.variants.map(v => v.price)) : 0;
                    return (
                        <motion.div 
                            key={s.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.4 }}
                            onClick={() => handleServiceSelect(s)}
                            className={`group bg-white rounded-[2rem] p-4 cursor-pointer border-2 transition-all relative overflow-hidden ${selectedService?.id===s.id ? "border-blue-600 ring-4 ring-blue-50 shadow-2xl scale-[1.02] z-10" : "border-transparent hover:border-slate-200 hover:shadow-xl"}`}
                        >
                            {/* Badge */}
                            {s.badge && <span className="absolute top-4 right-4 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider z-20 shadow-lg">{s.badge}</span>}
                            
                            <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4 bg-slate-100 relative">
                                <img src={s.booking_image_url || s.image_url || FALLBACK_IMG} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e)=>(e.target as HTMLImageElement).src=FALLBACK_IMG} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-black leading-none mb-1">{s.title}</h3>
                                    <p className="text-xs font-medium opacity-80 line-clamp-1">{s.description}</p>
                                </div>
                            </div>
                            
                            <div className="px-2 flex justify-between items-center">
                                <div className="flex flex-wrap gap-1">
                                    {s.benefits?.slice(0,2).map((b,i) => <span key={i} className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg">{b}</span>)}
                                </div>
                                <span className="text-lg font-black text-slate-900">₹{minPrice}+</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
                
        {/* --- RIGHT: CONFIGURATION & BILL (STICKY) --- */}
        <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-white/50 lg:sticky lg:top-8 h-fit">
                
                <h2 className="font-black text-2xl mb-6 flex items-center gap-2">
                    <Sparkles className="text-blue-600" /> <span>CONFIGURE</span>
                </h2>

                {selectedService ? (
                    <form onSubmit={handleBooking} className="space-y-8">
                        
                        {/* 1. Variants */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Plan</label>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedService.variants.map((v) => (
                                    <button type="button" key={v.id} onClick={() => setSelectedVariant(v)}
                                        className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${selectedVariant?.id === v.id ? "border-blue-600 bg-blue-50/50 text-blue-900" : "border-slate-100 bg-white text-slate-400 hover:border-slate-300"}`}
                                    >
                                        <div className="text-xs font-black uppercase">{v.duration}</div>
                                        <div className="text-sm font-bold">₹{v.price}</div>
                                        {selectedVariant?.id === v.id && <div className="absolute top-2 right-2 text-blue-600"><CheckCircle2 size={14}/></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Guests */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Guests</label>
                            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-fit">
                                <button type="button" onClick={() => setFormData({...formData, guests: Math.max(1, formData.guests - 1)})} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900 hover:text-blue-600"><Minus size={18}/></button>
                                <span className="text-lg font-black w-8 text-center">{formData.guests}</span>
                                <button type="button" onClick={() => setFormData({...formData, guests: Math.min(selectedService.capacity, formData.guests + 1)})} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900 hover:text-blue-600"><Plus size={18}/></button>
                            </div>
                        </div>

                        {/* 3. Date & Time */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Schedule</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="date" className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                                    min={new Date().toISOString().split("T")[0]}
                                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} 
                                />
                            </div>
                            
                            {/* Time Slots Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                {loadingSlots ? <div className="col-span-4 text-center text-xs text-slate-400 py-4">Checking slots...</div> : 
                                 availableSlots.length === 0 ? <div className="col-span-4 text-center text-xs text-slate-400 py-4 italic">{slotStatus}</div> :
                                 availableSlots.map(t => (
                                    <button type="button" key={t} onClick={() => setFormData({...formData, time: t})}
                                        className={`py-2 rounded-xl text-[10px] font-bold transition-all ${formData.time === t ? "bg-black text-white shadow-lg scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Details */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Your Details</label>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                            <div className="grid grid-cols-2 gap-3">
                                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" type="tel" placeholder="Phone" maxLength={10} value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value.replace(/\D/g,"")})} />
                                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                            </div>
                        </div>

                        {/* 5. Payment & Coupon */}
                        <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Offers & Payment</label>
                             <div className="flex gap-2">
                                <input className="flex-1 p-3 bg-slate-50 rounded-2xl font-bold text-sm uppercase outline-none placeholder:text-slate-300" placeholder="PROMO CODE" value={formData.promoCode} onChange={e=>setFormData({...formData, promoCode:e.target.value})} />
                                <button type="button" onClick={handleApplyCoupon} className="px-4 bg-slate-900 text-white rounded-2xl font-bold text-xs"><Tag size={16}/></button>
                             </div>

                             <div className="flex bg-slate-100 p-1 rounded-2xl">
                                <button type="button" onClick={()=>setPaymentMethod("qr")} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${paymentMethod==="qr"?"bg-white shadow-sm text-blue-600":"text-slate-400"}`}>UPI / QR</button>
                                <button type="button" onClick={()=>setPaymentMethod("cash")} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${paymentMethod==="cash"?"bg-white shadow-sm text-green-600":"text-slate-400"}`}>Pay at Venue</button>
                            </div>
                            
                            {paymentMethod === 'qr' && (
                                <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                                    <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-3 shadow-sm p-2"><img src={adminSettings.upi_qr} className="w-full h-full object-contain"/></div>
                                    <input className="w-full p-3 text-center bg-white rounded-xl font-bold text-sm outline-none border border-blue-200 focus:border-blue-500 uppercase tracking-widest" placeholder="ENTER UTR / REF NO" value={formData.utr} onChange={e=>setFormData({...formData, utr:e.target.value})} />
                                </div>
                            )}
                        </div>

                        {/* 6. INVOICE SUMMARY */}
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2"><Receipt size={14}/> Invoice</h3>
                            
                            <div className="space-y-3 text-sm font-medium text-slate-300">
                                <div className="flex justify-between">
                                    <span>Base Rate ({selectedVariant?.duration})</span>
                                    <span>₹{basePrice}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Guests (x{formData.guests})</span>
                                    <span>x {formData.guests}</span>
                                </div>
                                <div className="w-full h-px bg-slate-800 my-2"></div>
                                <div className="flex justify-between text-white font-bold">
                                    <span>Subtotal</span>
                                    <span>₹{subTotal}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Discount</span>
                                        <span>- ₹{discountAmount}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-widest text-slate-500">Total Payable</span>
                                    <span className="text-3xl font-black tracking-tighter">₹{finalTotal}</span>
                                </div>
                                <button disabled={loading} className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase text-xs tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2">
                                    {loading ? "Processing..." : <>Pay Now <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </div>

                    </form>
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        <ArrowRight className="mx-auto mb-4 animate-pulse" />
                        <p className="text-xs font-bold uppercase tracking-widest">Select a protocol to begin</p>
                    </div>
                )}
            </div>
        </div> 
      </div> 
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}