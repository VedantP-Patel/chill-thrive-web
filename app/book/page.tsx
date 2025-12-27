"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BookPage() {
  const router = useRouter();

  // --- STATE ---
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  const [duration, setDuration] = useState("60"); 
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("Pay at Shop"); 
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // --- 1. FETCH ACTIVE SERVICES ---
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, title, price, previous_price, image_url, booking_image_url")
        .eq("is_active", true)
        .order("id", { ascending: true });
      
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  // --- 2. TIME & DATE LOGIC ---
  const todayStr = new Date().toISOString().split("T")[0];

  const getAvailableTimeSlots = () => {
    const slots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
      "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    if (!date) return [];
    if (date > todayStr) return slots;
    if (date === todayStr) {
      const now = new Date();
      return slots.filter((slot) => {
        const [timePart, modifier] = slot.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        
        const slotDate = new Date();
        slotDate.setHours(hours, minutes, 0, 0);
        return slotDate > now;
      });
    }
    return slots;
  };

  const availableSlots = getAvailableTimeSlots();

  // --- 3. INPUT VALIDATION ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  // --- 4. SUBMIT BOOKING (FIXED COLUMN NAMES) ---
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      setStatus("Error: Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    setStatus("Processing...");

    const initialStatus = paymentMethod === "QR Code" ? "payment_review" : "pending";

    const { error } = await supabase.from("bookings").insert([{
      service_id: selectedService.id,
      
      // FIX 1: Send 'service_type' (Your DB wants this)
      service_type: selectedService.title, 
      
      user_name: name,
      user_email: email,
      user_phone: phone,
      
      // FIX 2: Send 'booking_date' (Your DB calls it this, NOT 'date')
      booking_date: date, 
      
      time: time,
      duration: duration + " min", 
      payment_method: paymentMethod, 
      status: initialStatus
    }]);

    if (error) {
      setStatus(`Error: ${error.message}`);
      setLoading(false);
    } else {
      if (paymentMethod === "QR Code") {
         setStatus("Booking submitted! Waiting for payment confirmation.");
      } else {
         setStatus("Booking Confirmed! See you at the shop.");
      }
      setTimeout(() => router.push("/"), 3000);
    }
  };

  // --- 5. IMAGE LOGIC ---
  const getDisplayImage = () => {
    if (!selectedService) return "url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop')";
    if (selectedService.booking_image_url && selectedService.booking_image_url.startsWith("http")) return `url('${selectedService.booking_image_url}')`;
    if (selectedService.image_url && selectedService.image_url.startsWith("http")) return `url('${selectedService.image_url}')`;
    
    const title = selectedService.title.toLowerCase();
    if (title.includes("ice") || title.includes("cold")) return "url('https://images.unsplash.com/photo-1596131397999-d47a75053b23?q=80&w=800&fit=crop')";
    if (title.includes("massage")) return "url('https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=800&fit=crop')";
    return "url('https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=800&fit=crop')";
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* --- LEFT PANEL --- */}
        <div 
          className="relative md:w-1/3 text-white flex flex-col justify-between p-8 transition-all duration-700 ease-in-out bg-blue-900 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: getDisplayImage() }}
        >
          <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${selectedService ? "bg-blue-900/85 mix-blend-multiply" : "bg-blue-900"}`}></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-3xl font-light mb-6">Book Session</h2>
              <p className="text-blue-100 mb-8 text-sm leading-relaxed font-medium">
                {selectedService ? "Great choice. Review your details and confirm your recovery time." : "Select a service, duration, and time to reserve your spot."}
              </p>
            </div>
            
            {selectedService && (
              <div className="bg-white/10 p-4 rounded-lg border border-white/20 backdrop-blur-sm space-y-2 shadow-lg animate-fade-in-up">
                <div>
                  <p className="text-xs uppercase tracking-widest text-blue-200">Selected Service</p>
                  <p className="font-bold text-lg text-white">{selectedService.title}</p>
                </div>
                
                <div className="flex justify-between items-center border-t border-white/20 pt-2">
                  <span className="text-blue-100 text-sm">Duration: {duration} min</span>
                  <div className="flex items-center gap-2">
                    {selectedService.previous_price && (
                      <span className="text-sm line-through text-blue-300">₹{selectedService.previous_price}</span>
                    )}
                    <span className="font-bold text-white text-lg">₹{selectedService.price}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT PANEL --- */}
        <div className="p-8 md:w-2/3 bg-white">
          <form onSubmit={handleBooking} className="space-y-6">
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <button key={s.id} type="button" onClick={() => setSelectedService(s)} className={`p-3 rounded-lg border text-left transition-all ${selectedService?.id === s.id ? "border-blue-900 bg-blue-50 text-blue-900 ring-1 ring-blue-900 shadow-sm" : "border-gray-200 hover:border-blue-300 text-gray-600 hover:bg-gray-50"}`}>
                        <span className="block font-medium">{s.title}</span>
                      </button>
                    ))}
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setDuration("30")} className={`flex-1 py-3 rounded-lg border font-medium transition-all ${duration === "30" ? "bg-blue-900 text-white border-blue-900 shadow-md transform scale-105" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>30 Mins</button>
                    <button type="button" onClick={() => setDuration("60")} className={`flex-1 py-3 rounded-lg border font-medium transition-all ${duration === "60" ? "bg-blue-900 text-white border-blue-900 shadow-md transform scale-105" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>60 Mins</button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-900 outline-none hover:border-blue-400 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-gray-100 transition" required disabled={!date}>
                  <option value="">Select Time</option>
                  {availableSlots.map((slot) => ( <option key={slot} value={slot}>{slot}</option> ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-black transition" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-black transition" required />
                <input type="tel" placeholder="Phone (10 digits)" value={phone} onChange={handlePhoneChange} maxLength={10} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-black transition" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setPaymentMethod("Pay at Shop")} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === "Pay at Shop" ? "border-blue-900 bg-blue-50 ring-1 ring-blue-900 text-blue-900" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                  <span className="font-bold">Pay at Shop</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod("QR Code")} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === "QR Code" ? "border-blue-900 bg-blue-50 ring-1 ring-blue-900 text-blue-900" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                  <span className="font-bold">UPI / QR Code</span>
                </button>
              </div>
              {paymentMethod === "QR Code" && (
                <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center animate-fade-in-up">
                   <p className="text-sm text-gray-600 mb-3 font-medium">Scan to Pay via UPI</p>
                   <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="Payment QR" width={150} height={150} />
                   </div>
                   <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">After paying, click confirm. Your booking will be reviewed by admin.</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !selectedService || !date || !time || phone.length !== 10} className="w-full bg-blue-900 text-white py-4 rounded-xl font-semibold hover:bg-blue-800 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1">
              {loading ? "Confirming..." : (paymentMethod === "QR Code" ? "Confirm Payment Sent" : "Confirm Booking")}
            </button>
            
            {status && <p className={`text-center text-sm font-bold animate-pulse ${status.includes("Error") ? "text-red-600" : "text-blue-900"}`}>{status}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}