"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";

// REMOVED: export const revalidate = 0; (This was causing the crash)

export default function BookPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", date: "", time: "10:00", guests: 1 });
  const [loading, setLoading] = useState(false);
  
  // DISCOUNT STATE
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState<{ type: string, value: number, code: string } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");

  // 1. FETCH SERVICES
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("price");
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  // 2. HANDLE COUPON
  const applyCoupon = async () => {
    if(!promoCode) return;
    setCouponMessage("Verifying...");
    
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setDiscount(null);
      setCouponMessage("❌ Invalid or Expired Code");
    } else {
      setDiscount({ type: data.discount_type, value: data.discount_value, code: data.code });
      setCouponMessage(`✅ Code Applied: ${data.code}`);
    }
  };

  // 3. CALCULATE TOTAL
  const basePrice = selectedService ? selectedService.price * formData.guests : 0;
  const discountAmount = discount 
    ? (discount.type === 'percent' ? (basePrice * discount.value / 100) : discount.value) 
    : 0;
  const finalTotal = Math.max(0, basePrice - discountAmount);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return alert("Select a service");
    setLoading(true);

    const { error } = await supabase.from("bookings").insert([{
      user_name: formData.name,
      user_email: formData.email,
      user_phone: formData.phone,
      booking_date: formData.date,
      time: formData.time,
      service_type: selectedService.title,
      duration: "60 Min",
      status: "payment_review", // Waiting for payment
      payment_method: "QR Code", 
      transaction_id: "PENDING", // In a real app, you'd collect UTR here or integrate Gateway
      total_amount: finalTotal // Store the discounted price
    }]);

    if (error) alert("Booking Failed");
    else {
      alert(`Booking Request Sent! Pay ₹${finalTotal} via QR Code to confirm.`);
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-50 pt-24 pb-20 px-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT: SERVICE SELECTION */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-4xl font-black tracking-tighter mb-8">SELECT PROTOCOL</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setSelectedService(s)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${selectedService?.id === s.id ? "border-blue-600 bg-white shadow-xl scale-[1.02]" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
              >
                {/* COMBO BADGE */}
                {s.type === 'combo' && (
                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                        🧩 COMBO DEAL
                    </div>
                )}
                
                <div className="relative h-40 w-full mb-4 rounded-xl overflow-hidden bg-gray-100">
                    <img 
                        src={s.booking_image_url || s.image_url || "https://placehold.co/600x400"} 
                        alt={s.title} 
                        className="w-full h-full object-cover" 
                    />
                </div>
                
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{s.title}</h3>
                    <div className="text-right">
                        <span className="block font-bold text-blue-600">₹{s.price}</span>
                        {s.previous_price && <span className="text-xs text-gray-400 line-through">₹{s.previous_price}</span>}
                    </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                {/* Capacity Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span>👥 Up to {s.capacity} People</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CHECKOUT FORM */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 h-fit sticky top-24">
          <h2 className="font-bold text-xl mb-6">Your Session</h2>
          
          <form onSubmit={handleBooking} className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Date</label><input type="date" required className="w-full p-3 border rounded-lg font-bold" onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-gray-400 uppercase">Time</label><input type="time" required className="w-full p-3 border rounded-lg font-bold" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-400 uppercase">Name</label><input type="text" placeholder="Your Name" required className="w-full p-3 border rounded-lg" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase">Guests</label><input type="number" min="1" max={selectedService?.capacity || 5} className="w-full p-3 border rounded-lg" value={formData.guests} onChange={e => setFormData({...formData, guests: Number(e.target.value)})} /></div>
            </div>
            
            <input type="email" placeholder="Email" required className="w-full p-3 border rounded-lg" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="tel" placeholder="Phone" required className="w-full p-3 border rounded-lg" onChange={e => setFormData({...formData, phone: e.target.value})} />

            {/* PROMO CODE SECTION */}
            <div className="pt-4 border-t border-dashed">
                <label className="text-xs font-bold text-gray-400 uppercase">Promo Code</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg uppercase font-mono text-sm" 
                        placeholder="SUMMER20"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                    />
                    <button type="button" onClick={applyCoupon} className="px-4 bg-black text-white rounded-lg text-xs font-bold uppercase hover:bg-zinc-800">Apply</button>
                </div>
                {couponMessage && <p className={`text-xs mt-2 font-bold ${couponMessage.includes("✅") ? "text-green-600" : "text-red-500"}`}>{couponMessage}</p>}
            </div>

            {/* TOTALS */}
            <div className="pt-6 mt-6 border-t space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{basePrice}</span></div>
                {discount && <div className="flex justify-between text-sm text-green-600 font-bold"><span>Discount ({discount.code})</span><span>- ₹{discountAmount.toFixed(0)}</span></div>}
                <div className="flex justify-between text-2xl font-black mt-2"><span>Total</span><span>₹{finalTotal.toFixed(0)}</span></div>
            </div>

            <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all text-lg uppercase tracking-widest mt-4">
                {loading ? "Processing..." : "Confirm & Pay"}
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">Payment via QR Code on next step.</p>
          </form>
        </div>

      </div>
    </main>
  );
}