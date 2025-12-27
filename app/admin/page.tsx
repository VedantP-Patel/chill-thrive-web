"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

// --- TYPES ---
type Service = {
  id: number;
  title: string;
  description: string;
  price: number;
  previous_price: number | null;
  capacity: number;
  is_active: boolean;
  image_url: string;
  booking_image_url: string;
};

type Booking = {
  id: number;
  booking_date: string;
  time: string;
  duration: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  service_id: number;
  service_type: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  services?: { title: string };
};

type Schedule = {
  id: number;
  type: string;
  date: string | null;
  slots: string[];
  is_closed: boolean;
  service_id: number | null;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "schedule" | "settings">("bookings");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");

  // --- DATA STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  // --- SETTINGS STATE (QR) ---
  const [qrUrl, setQrUrl] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // --- EDITING STATE (Services) ---
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formService, setFormService] = useState<Partial<Service>>({});
  const [homeFile, setHomeFile] = useState<File | null>(null);
  const [homePreview, setHomePreview] = useState<string | null>(null);
  const [bookingFile, setBookingFile] = useState<File | null>(null);
  const [bookingPreview, setBookingPreview] = useState<string | null>(null);

  // --- EDITING STATE (Schedule) ---
  const [scheduleScope, setScheduleScope] = useState<number | "global">("global");
  const [newDate, setNewDate] = useState("");
  const [newSlots, setNewSlots] = useState("09:00 AM, 10:00 AM, 11:00 AM, 12:00 PM");
  const [isClosed, setIsClosed] = useState(false);

  // --- INITIAL DATA FETCH ---
  const fetchData = async () => {
    // 1. Services
    const { data: sData } = await supabase.from("services").select("*").order("id");
    if (sData) setServices(sData);

    // 2. Bookings
    const { data: bData } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (bData) {
      const serviceMap = new Map(sData?.map((s) => [s.id, s.title]));
      const joined = bData.map((b) => ({
        ...b,
        services: { title: serviceMap.get(b.service_id) || "Unknown" },
      }));
      setBookings(joined);
    }

    // 3. Schedules
    const { data: schData } = await supabase.from("schedules").select("*").order("date");
    if (schData) setSchedules(schData);

    // 4. Settings (QR)
    const { data: setData } = await supabase.from("settings").select("value").eq("key", "upi_qr").single();
    if (setData) setQrUrl(setData.value);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // ==========================
  // HANDLERS: SETTINGS (QR)
  // ==========================
  const handleUpdateQR = async () => {
    if (!qrFile) return notify("Please select an image first.");
    setLoading(true);

    const fileName = `qr-${Date.now()}`;
    // Upload to 'service-images' bucket (reusing it is fine)
    const { error: uploadError } = await supabase.storage.from("service-images").upload(fileName, qrFile);
    
    if (uploadError) {
        notify("Upload failed: " + uploadError.message);
        setLoading(false);
        return;
    }

    const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // Update DB
    const { error: dbError } = await supabase.from("settings").update({ value: publicUrl }).eq("key", "upi_qr");

    if (dbError) {
        // Fallback insert if row missing
        await supabase.from("settings").insert([{ key: "upi_qr", value: publicUrl }]);
    }

    setQrUrl(publicUrl);
    setQrFile(null);
    setQrPreview(null);
    notify("QR Code Updated Successfully!");
    setLoading(false);
  };

  // ==========================
  // HANDLERS: SERVICES
  // ==========================
  const handleSelectService = (s: Service) => {
    setSelectedService(s);
    setFormService({ ...s });
    setHomePreview(s.image_url);
    setBookingPreview(s.booking_image_url);
    setHomeFile(null);
    setBookingFile(null);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formService) return;
    setLoading(true);

    let finalHomeUrl = formService.image_url;
    let finalBookingUrl = formService.booking_image_url;

    if (homeFile) {
      const fileName = `home-${Date.now()}`;
      await supabase.storage.from("service-images").upload(fileName, homeFile);
      const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
      finalHomeUrl = data.publicUrl;
    }
    if (bookingFile) {
      const fileName = `booking-${Date.now()}`;
      await supabase.storage.from("service-images").upload(fileName, bookingFile);
      const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
      finalBookingUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("services")
      .update({ ...formService, image_url: finalHomeUrl, booking_image_url: finalBookingUrl })
      .eq("id", selectedService.id);

    if (error) notify(`Error: ${error.message}`);
    else {
      notify("Service updated successfully!");
      fetchData();
    }
    setLoading(false);
  };

  const handleCreateService = async () => {
    if (!confirm("Create a new blank service?")) return;
    const { error } = await supabase.from("services").insert([{ title: "New Service", price: 0, is_active: false }]);
    if (!error) fetchData();
  };

  // ==========================
  // HANDLERS: BOOKINGS
  // ==========================
  const handleVerifyPayment = async (id: number) => {
    if (!confirm("Confirm payment receipt?")) return;
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    fetchData();
    notify("Booking confirmed.");
  };

  // ==========================
  // HANDLERS: SCHEDULE
  // ==========================
  const getCurrentScheduleList = () => {
    const scopeId = scheduleScope === "global" ? null : scheduleScope;
    return schedules.filter((s) => s.service_id === scopeId);
  };

  const handleSaveStandardSchedule = async (type: string, val: string) => {
    const scopeId = scheduleScope === "global" ? null : scheduleScope;
    const slots = val.split(",").map((s) => s.trim()).filter(Boolean);
    const existing = schedules.find((s) => s.type === type && s.service_id === scopeId);

    if (existing) {
      await supabase.from("schedules").update({ slots }).eq("id", existing.id);
    } else {
      await supabase.from("schedules").insert([{ type, slots, service_id: scopeId }]);
    }
    notify(`${type} hours updated!`);
    fetchData();
  };

  const handleAddException = async () => {
    if (!newDate) return notify("Please pick a date");
    const scopeId = scheduleScope === "global" ? null : scheduleScope;
    const slots = isClosed ? [] : newSlots.split(",").map((s) => s.trim()).filter(Boolean);

    await supabase.from("schedules").insert([{ type: "custom", date: newDate, slots, is_closed: isClosed, service_id: scopeId }]);
    setNewDate("");
    setIsClosed(false);
    fetchData();
    notify("Exception added.");
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm("Delete rule?")) return;
    await supabase.from("schedules").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* --- TOPBAR --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">A</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Chill Thrive Recovery</p>
          </div>
        </div>

        {/* TAB NAV */}
        <nav className="flex bg-slate-100 p-1 rounded-lg">
          {(["bookings", "services", "schedule", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-slate-900 hover:bg-gray-200"
              }`}
            >
              {tab}
              {tab === "bookings" && bookings.some((b) => (b.status || 'pending') === "payment_review") && (
                <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* --- NOTIFICATION --- */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-up z-50 flex items-center gap-3">
          <span className="text-green-400 text-xl">✓</span>
          {notification}
        </div>
      )}

      <main className="flex-1 overflow-hidden flex">
        
        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="w-full h-full overflow-y-auto p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Bookings Overview</h2>
                  <p className="text-sm text-gray-500">Manage incoming appointments and payments.</p>
                </div>
                <button onClick={fetchData} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                  ↻ Refresh
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Date / Time</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Payment & Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((b) => {
                      const safeStatus = b.status || "pending";
                      const isReview = safeStatus === "payment_review";
                      const isPending = safeStatus === "pending";
                      return (
                        <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${isReview ? "bg-yellow-50/60" : ""}`}>
                          <td className="p-4 align-top">
                            <div className="font-bold text-slate-900">{b.booking_date}</div>
                            <div className="text-gray-500 text-xs">{b.time}</div>
                            <div className="text-gray-400 text-xs mt-1">{b.duration}</div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-medium text-slate-900">{b.user_name}</div>
                            <div className="text-blue-600 text-xs">{b.user_phone}</div>
                            <div className="text-gray-400 text-xs">{b.user_email}</div>
                          </td>
                          <td className="p-4 align-top">
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                              {b.services?.title || "Unknown"}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${safeStatus === "confirmed" ? "bg-green-100 text-green-700" : ""} ${isReview ? "bg-yellow-100 text-yellow-800 animate-pulse" : ""} ${isPending ? "bg-gray-100 text-gray-600" : ""}`}>
                                {isReview ? "Verify Payment" : safeStatus.replace("_", " ")}
                              </span>
                              {b.payment_method === "QR Code" && <div className="text-xs bg-white border border-gray-200 p-2 rounded shadow-sm"><span className="block text-gray-400 text-[10px] uppercase font-bold">UTR / Ref No.</span><span className="font-mono text-slate-900 font-bold select-all">{b.transaction_id || "MISSING"}</span></div>}
                              {b.payment_method === "Pay at Shop" && <span className="text-[10px] text-gray-400">Cash / Card on arrival</span>}
                            </div>
                          </td>
                          <td className="p-4 align-top text-right">
                            {(isReview || isPending) && (
                              <button onClick={() => handleVerifyPayment(b.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all text-white ${isReview ? "bg-slate-900 hover:bg-slate-800" : "bg-blue-600 hover:bg-blue-700"}`}>
                                {isReview ? "Approve UPI" : "Mark Paid"}
                              </button>
                            )}
                            {safeStatus === "confirmed" && <span className="text-green-500 text-lg">✓</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {bookings.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No bookings found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <div className="flex w-full h-full">
            <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Services List</h3>
                <button onClick={handleCreateService} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold">+ Add New</button>
              </div>
              <div className="overflow-y-auto flex-1">
                {services.map((s) => (
                  <button key={s.id} onClick={() => handleSelectService(s)} className={`w-full text-left p-4 border-l-4 transition-all hover:bg-gray-50 ${selectedService?.id === s.id ? "border-blue-900 bg-blue-50" : "border-transparent"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.is_active ? "bg-green-500" : "bg-red-300"}`} />
                      <div><div className={`font-bold text-sm ${selectedService?.id === s.id ? "text-blue-900" : "text-slate-700"}`}>{s.title}</div><div className="text-xs text-gray-400">Cap: {s.capacity || 1} • ₹{s.price}</div></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-slate-50 p-10 overflow-y-auto flex justify-center">
              {selectedService ? (
                <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div><h2 className="text-2xl font-bold text-slate-900">Edit Service</h2><p className="text-sm text-gray-500">ID: {selectedService.id}</p></div>
                    <div className="flex gap-2"><button type="button" onClick={() => setFormService({ ...formService, is_active: !formService.is_active })} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formService.is_active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{formService.is_active ? "Active" : "Inactive"}</button></div>
                  </div>
                  <form onSubmit={handleSaveService} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Landscape Image</label><div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">{homePreview ? <Image src={homePreview} alt="prev" fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><label className="cursor-pointer text-white text-xs font-bold border border-white px-3 py-1 rounded">Upload <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { setHomeFile(e.target.files[0]); setHomePreview(URL.createObjectURL(e.target.files[0])); }}} /></label></div></div></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Portrait Image</label><div className="aspect-[3/4] w-32 mx-auto relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">{bookingPreview ? <Image src={bookingPreview} alt="prev" fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><label className="cursor-pointer text-white text-xs font-bold border border-white px-3 py-1 rounded">Upload <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { setBookingFile(e.target.files[0]); setBookingPreview(URL.createObjectURL(e.target.files[0])); }}} /></label></div></div></div>
                    </div>
                    <div className="space-y-5">
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Title</label><input type="text" value={formService.title || ""} onChange={(e) => setFormService({ ...formService, title: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-medium" /></div>
                      <div className="grid grid-cols-3 gap-5">
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label><input type="number" value={formService.price || 0} onChange={(e) => setFormService({ ...formService, price: Number(e.target.value) })} className="w-full p-3 bg-white border border-gray-300 rounded-lg font-bold" /></div>
                         <div><label className="block text-sm font-bold text-gray-500 mb-1">Old Price</label><input type="number" value={formService.previous_price || 0} onChange={(e) => setFormService({ ...formService, previous_price: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 line-through" /></div>
                         <div><label className="block text-sm font-bold text-blue-900 mb-1">Slots / Hour</label><input type="number" value={formService.capacity || 1} onChange={(e) => setFormService({ ...formService, capacity: Number(e.target.value) })} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold" /></div>
                      </div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Description</label><textarea rows={4} value={formService.description || ""} onChange={(e) => setFormService({ ...formService, description: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" /></div>
                    </div>
                    <div className="pt-6 border-t flex justify-end"><button type="submit" disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl">{loading ? "Saving..." : "Save Changes"}</button></div>
                  </form>
                </div>
              ) : ( <div className="flex flex-col items-center justify-center h-full text-gray-400"><div className="w-16 h-16 bg-gray-200 rounded-full mb-4 animate-pulse"></div><p>Select a service to edit.</p></div> )}
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div><h2 className="text-lg font-bold text-slate-900">Scheduling Rules</h2><p className="text-sm text-gray-500">Defining hours for: <span className="font-bold text-blue-600">{scheduleScope === 'global' ? 'Global Defaults' : services.find(s=>s.id===scheduleScope)?.title}</span></p></div>
                 <select className="p-3 bg-slate-100 border-none rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" value={scheduleScope} onChange={(e) => setScheduleScope(e.target.value === "global" ? "global" : Number(e.target.value))}>
                    <option value="global">🌍 Global (All Services)</option>
                    <optgroup label="Specific Service Overrides">{services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
                 </select>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                 <h3 className="text-lg font-bold text-slate-900">Standard Weekly Hours</h3>
                 {(["weekday", "weekend"] as const).map((type) => {
                    const rule = getCurrentScheduleList().find((s) => s.type === type);
                    const defaultVal = rule ? rule.slots.join(", ") : "";
                    return (
                       <div key={type}>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-2">{type}s</label>
                          <div className="flex gap-3"><input type="text" id={`input-${type}`} defaultValue={defaultVal} placeholder={scheduleScope !== 'global' && !defaultVal ? "(Using Global Defaults)" : "e.g. 09:00 AM, 10:00 AM"} className="flex-1 p-3 border border-gray-300 rounded-lg text-sm font-mono text-slate-700" /><button onClick={() => { const val = (document.getElementById(`input-${type}`) as HTMLInputElement).value; handleSaveStandardSchedule(type, val); }} className="bg-slate-900 text-white px-5 rounded-lg font-bold text-sm hover:bg-slate-800">Save</button></div>
                       </div>
                    );
                 })}
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="text-lg font-bold text-slate-900 mb-6">Date Exceptions</h3>
                 <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl mb-6">
                    <h4 className="text-xs font-bold text-blue-900 uppercase mb-3">Add New Rule</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                       <div className="w-full md:w-auto"><label className="text-xs font-bold text-gray-500 mb-1 block">Date</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full p-2.5 border rounded-lg" /></div>
                       <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-500 mb-1 block">Slots {isClosed && "(Ignored)"}</label><input type="text" value={newSlots} onChange={(e) => setNewSlots(e.target.value)} disabled={isClosed} className={`w-full p-2.5 border rounded-lg text-sm ${isClosed ? 'bg-gray-200' : 'bg-white'}`} /></div>
                       <div className="flex items-center gap-2 h-10 px-2 bg-white rounded border"><input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} className="w-4 h-4" /><label className="text-xs font-bold text-red-600">Close Shop</label></div>
                       <button onClick={handleAddException} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 w-full md:w-auto">Add Rule</button>
                    </div>
                 </div>
                 <div className="space-y-3">
                    {getCurrentScheduleList().filter(s => s.type === 'custom').length === 0 && <p className="text-center text-gray-400 text-sm py-4 italic">No exceptions set for this scope.</p>}
                    {getCurrentScheduleList().filter(s => s.type === 'custom').map(s => (
                       <div key={s.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4"><span className="font-mono font-bold text-slate-700 bg-gray-100 px-3 py-1 rounded text-sm">{s.date}</span>{s.is_closed ? <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">⛔ CLOSED</span> : <span className="text-sm text-gray-600">{s.slots.join(", ")}</span>}</div>
                          <button onClick={() => handleDeleteRule(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50">Delete</button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB (NEW) */}
        {activeTab === "settings" && (
           <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-10 flex justify-center">
             <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Global Settings</h2>
                <p className="text-sm text-gray-500 mb-8">Manage app-wide configurations.</p>
                
                {/* QR Section */}
                <div className="space-y-4">
                   <h3 className="font-bold text-gray-900 border-b pb-2">Payment QR Code</h3>
                   <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <div className="relative w-48 h-48 bg-white p-2 shadow-sm rounded-lg mb-4">
                         {qrPreview ? (
                            <Image src={qrPreview} alt="New QR" fill className="object-contain" />
                         ) : (
                            <Image src={qrUrl || "https://placehold.co/200"} alt="Current QR" fill className="object-contain" />
                         )}
                      </div>
                      <p className="text-xs text-gray-500 mb-4 text-center">Current Active QR Code used on Booking Page</p>
                      
                      <label className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-100 transition-colors">
                         Select New Image
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                             if(e.target.files?.[0]) {
                                 setQrFile(e.target.files[0]);
                                 setQrPreview(URL.createObjectURL(e.target.files[0]));
                             }
                         }} />
                      </label>

                      {qrFile && (
                         <div className="mt-4 w-full animate-fade-in-up">
                            <button 
                               onClick={handleUpdateQR} 
                               disabled={loading}
                               className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50"
                            >
                               {loading ? "Uploading..." : "Save New QR Code"}
                            </button>
                            <button onClick={() => { setQrFile(null); setQrPreview(null); }} className="w-full text-red-500 text-xs font-bold mt-2 hover:underline">Cancel</button>
                         </div>
                      )}
                   </div>
                </div>

             </div>
           </div>
        )}

      </main>
    </div>
  );
}