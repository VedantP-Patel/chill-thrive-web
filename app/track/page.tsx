"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function TrackPage() {
  // --- STATE ---
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); // NEW: Email State
  const [bookings, setBookings] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- SEARCH LOGIC ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || !email) return;
    
    setLoading(true);
    setSearched(false);
    setBookings([]);

    // QUERY: Must match BOTH Phone AND Email
    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_phone", phone)
      .eq("user_email", email) // <--- STRICT MATCHING
      .order("created_at", { ascending: false });

    if (bookingsData && bookingsData.length > 0) {
      // Get Service Titles
      const { data: servicesData } = await supabase.from("services").select("id, title");
      const serviceMap: any = {};
      if (servicesData) servicesData.forEach((s: any) => serviceMap[s.id] = s.title);

      const combined = bookingsData.map((b: any) => ({
        ...b,
        service_title: serviceMap[b.service_id] || "Unknown Service"
      }));

      setBookings(combined);
    }
    
    setSearched(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 flex flex-col items-center">
      
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Track Booking</h1>
        <p className="text-gray-500 text-center mb-8">Enter your details to verify and check status.</p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 space-y-4">
          
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-900 outline-none transition-all"
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="same as booking"
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-900 outline-none transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || phone.length < 10 || !email}
            className="w-full bg-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 disabled:bg-gray-400 transition-colors shadow-lg"
          >
            {loading ? "Verifying..." : "Check Status"}
          </button>
        </form>

        {/* RESULTS AREA */}
        {searched && (
          <div className="space-y-4 animate-fade-in-up">
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                  
                  {/* Status Strip */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    b.status === 'confirmed' ? 'bg-green-500' : 
                    b.status === 'payment_review' ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}></div>

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{b.service_title}</h3>
                      <p className="text-sm text-gray-500">{b.booking_date} at {b.time}</p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">{b.user_email}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                       b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                       b.status === 'payment_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {b.status === 'payment_review' ? "Verifying" : b.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-400">ID: #{b.id}</div>
                    {b.status === 'confirmed' && <div className="text-green-600 text-sm font-bold">✓ Booking Approved</div>}
                    {b.status === 'payment_review' && <div className="text-yellow-600 text-xs text-right">Payment Verification Pending</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No bookings found matching these details.</p>
                <p className="text-xs text-gray-400">Make sure the phone and email match exactly.</p>
                <Link href="/book" className="text-blue-600 font-bold text-sm mt-4 block hover:underline">Book a session now</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}