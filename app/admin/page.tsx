"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function AdminPage() {
  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState("services");

  // --- SERVICES STATE ---
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [previousPrice, setPreviousPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [homeFile, setHomeFile] = useState<File | null>(null);
  const [homePreview, setHomePreview] = useState<string | null>(null);
  const [bookingFile, setBookingFile] = useState<File | null>(null);
  const [bookingPreview, setBookingPreview] = useState<string | null>(null);
  
  // --- BOOKINGS STATE ---
  const [bookings, setBookings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // --- 1. FETCH SERVICES ---
  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("id", { ascending: true });
    if (data) setServices(data);
  };

  // --- 2. FETCH BOOKINGS (Robust) ---
  const fetchBookings = async () => {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return;
    }

    const { data: servicesData } = await supabase.from("services").select("id, title");

    const serviceMap: any = {};
    if (servicesData) {
      servicesData.forEach((s: any) => {
        serviceMap[s.id] = s.title;
      });
    }

    const combinedData = bookingsData.map((b: any) => ({
      ...b,
      services: { title: serviceMap[b.service_id] || "Unknown Service" }
    }));

    setBookings(combinedData);
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // --- SERVICE HANDLERS ---
  const handleSelectService = (service: any) => {
    setSelectedService(service);
    setTitle(service.title);
    setDescription(service.description);
    setPrice(service.price);
    setPreviousPrice(service.previous_price || "");
    setIsActive(service.is_active);
    setHomePreview(service.image_url);
    setBookingPreview(service.booking_image_url);
    setHomeFile(null);
    setBookingFile(null);
    setStatus("");
  };

  const handleToggleStatus = async () => {
    if (!selectedService) return;
    const newStatus = !isActive;
    const { error } = await supabase.from("services").update({ is_active: newStatus }).eq("id", selectedService.id);
    if (!error) {
      setIsActive(newStatus);
      fetchServices();
    }
  };

  const handleDelete = async () => {
    if (!selectedService || !window.confirm("Delete this service?")) return;
    setLoading(true);
    const { error } = await supabase.from("services").delete().eq("id", selectedService.id);
    if (!error) {
      setSelectedService(null);
      fetchServices();
    }
    setLoading(false);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setLoading(true);
    setStatus("Processing...");

    let finalHomeUrl = selectedService.image_url;
    let finalBookingUrl = selectedService.booking_image_url;

    if (homeFile) {
      const fileName = `home-${Date.now()}-${homeFile.name}`;
      const { error } = await supabase.storage.from("service-images").upload(fileName, homeFile);
      if (!error) {
        const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
        finalHomeUrl = data.publicUrl;
      }
    }

    if (bookingFile) {
      const fileName = `booking-${Date.now()}-${bookingFile.name}`;
      const { error } = await supabase.storage.from("service-images").upload(fileName, bookingFile);
      if (!error) {
        const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
        finalBookingUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from("services")
      .update({ 
        title, description, price: Number(price), previous_price: previousPrice ? Number(previousPrice) : null,
        image_url: finalHomeUrl, booking_image_url: finalBookingUrl 
      })
      .eq("id", selectedService.id);

    if (error) setStatus(`Error: ${error.message}`);
    else {
      setStatus("Success! Changes Saved.");
      fetchServices();
    }
    setLoading(false);
  };

  // --- BOOKING HANDLERS ---
  const handleApprovePayment = async (bookingId: number) => {
    if(!window.confirm("Confirm that payment has been received?")) return;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if(!error) {
        fetchBookings(); 
    } else {
        alert("Error updating booking: " + error.message);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setFile: any, setPreview: any) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* --- TOP NAV / TABS --- */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button 
                  onClick={() => setActiveTab("services")}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === "services" ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                  Services
              </button>
              <button 
                  onClick={() => setActiveTab("bookings")}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === "bookings" ? "bg-white text-blue-900 shadow-sm relative" : "text-gray-600 hover:text-gray-900"}`}>
                  Bookings
                  {/* Safely check status existence */}
                  {bookings.some(b => (b.status || 'pending') === 'payment_review') && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
              </button>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= SERVICES TAB ================= */}
        {activeTab === "services" && (
          <>
            <div className="w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto">
              <div className="space-y-3">
                {services.map((s) => (
                  <button key={s.id} onClick={() => handleSelectService(s)} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedService?.id === s.id ? "border-blue-900 bg-blue-50 ring-1 ring-blue-900" : "border-gray-200 hover:bg-gray-50"}`}>
                    <div className={`w-3 h-3 rounded-full ${s.is_active ? "bg-green-500" : "bg-red-400"}`}></div>
                    <span className={`font-semibold ${s.is_active ? "text-gray-700" : "text-gray-400 italic"}`}>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-2/3 p-10 bg-slate-50 flex justify-center overflow-y-auto">
              {selectedService ? (
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl h-fit">
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Editing <span className="text-blue-600">{selectedService.title}</span></h2>
                    <div className="flex gap-3">
                      <button onClick={handleToggleStatus} type="button" className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{isActive ? "Pause" : "Resume"}</button>
                      <button onClick={handleDelete} type="button" className="px-4 py-2 rounded-lg text-sm font-bold bg-red-100 text-red-700">Delete</button>
                    </div>
                  </div>
                  <form onSubmit={handleUpdateService} className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Home (Landscape)</label>
                        <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden border mb-2">{homePreview && <Image src={homePreview} alt="Home" fill className="object-cover" />}</div>
                        <input type="file" onChange={(e) => handleFile(e, setHomeFile, setHomePreview)} className="text-xs w-full text-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Booking (Vertical)</label>
                        <div className="aspect-[9/16] relative bg-gray-100 rounded-lg overflow-hidden border mb-2 w-2/3 mx-auto">{bookingPreview && <Image src={bookingPreview} alt="Booking" fill className="object-cover" />}</div>
                        <input type="file" onChange={(e) => handleFile(e, setBookingFile, setBookingPreview)} className="text-xs w-full text-gray-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"> <label className="block text-sm font-medium text-gray-700">Current Price (₹)</label> <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded-lg text-black font-bold" /> </div>
                      <div className="col-span-1"> <label className="block text-sm font-medium text-gray-500">Previous Price (Optional)</label> <input type="number" value={previousPrice} onChange={(e) => setPreviousPrice(e.target.value)} placeholder="e.g. 2500" className="w-full p-2 border rounded-lg text-gray-500" /> </div>
                      <div className="col-span-1"> <label className="block text-sm font-medium text-gray-700">Service Title</label> <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-lg text-black" /> </div>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded-lg text-black" />
                    <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:bg-gray-400">{loading ? "Saving..." : "Save Changes"}</button>
                    {status && <p className="text-center text-sm font-bold text-blue-800 mt-2">{status}</p>}
                  </form>
                </div>
              ) : ( <p className="text-gray-400 mt-20">Select a service to edit</p> )}
            </div>
          </>
        )}

        {/* ================= BOOKINGS TAB ================= */}
        {activeTab === "bookings" && (
            <div className="w-full p-8 bg-slate-50 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Bookings</h2>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Date/Time</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Service</th>
                                    <th className="p-4">Payment</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.map((b) => {
                                    // CRASH FIX: Default status to 'pending' if null
                                    const safeStatus = b.status || "pending"; 

                                    return (
                                    <tr key={b.id} className={safeStatus === 'payment_review' ? "bg-yellow-50/50" : ""}>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{b.booking_date || b.date}</div>
                                            <div className="text-xs">{b.time} ({b.duration})</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{b.user_name}</div>
                                            <div className="text-xs">{b.user_phone}</div>
                                        </td>
                                        <td className="p-4">
                                            {b.services ? b.services.title : <span className="italic text-gray-400">Unknown Service</span>}
                                        </td>
                                        <td className="p-4 font-medium">
                                            {b.payment_method || "N/A"}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${safeStatus === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                                                ${safeStatus === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                                                ${safeStatus === 'payment_review' ? 'bg-yellow-100 text-yellow-800 animate-pulse' : ''}
                                            `}>
                                                {safeStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {safeStatus === 'payment_review' && (
                                                <button 
                                                    onClick={() => handleApprovePayment(b.id)}
                                                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    Approve Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                                {bookings.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">No bookings found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}