"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";

// --- TYPES ---
type Service = { 
  id: number; 
  title: string; 
  type: string; // 'single' | 'combo'
  price: number; 
  previous_price: number | null; 
  price_30: number; 
  previous_price_30: number | null; 
  description: string; 
  long_description: string; 
  benefits: string[]; 
  capacity: number; 
  is_active: boolean; 
  image_url: string; 
  booking_image_url: string; 
  detail_image_url: string; 
  badge: string; 
};
type Schedule = { id: number; type: string; date: string | null; slots: string[]; is_closed: boolean; service_id: number | null; };
type Testimonial = { id: number; name: string; role: string; message: string; video_url?: string; rating: number; is_active: boolean; };
type Booking = { id: number; booking_date: string; time: string; user_name: string; user_email: string; user_phone: string; service_type: string; status: string; payment_method: string; transaction_id: string; duration: string; created_at: string; };
type GalleryImage = { id: number; image_url: string; category?: string; };
type ContentBlock = { id: number; slug: string; title: string; content: string; category: string; };
type Event = { id: number; title: string; description: string; event_date: string; cover_image_url: string; };
type Message = { id: number; name: string; phone: string; message: string; created_at: string; };
type FounderProfile = { id: number; name: string; role: string; story: string; mission: string; value_1_title: string; value_1_desc: string; value_2_title: string; value_2_desc: string; quote: string; image_url: string; };
type Coupon = { id: number; code: string; discount_type: "percent" | "fixed"; discount_value: number; is_active: boolean; };

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "inbox" | "services" | "discounts" | "events" | "founder" | "gallery" | "schedule" | "content" | "testimonials" | "settings">("bookings");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- DATA STATES ---
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // --- EDIT STATES ---
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formService, setFormService] = useState<Partial<Service>>({});
  const [benefitsInput, setBenefitsInput] = useState(""); 
  const [homeFile, setHomeFile] = useState<File | null>(null); const [homePreview, setHomePreview] = useState<string | null>(null);
  const [bookingFile, setBookingFile] = useState<File | null>(null); const [bookingPreview, setBookingPreview] = useState<string | null>(null);
  const [detailFile, setDetailFile] = useState<File | null>(null); const [detailPreview, setDetailPreview] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentBlock | null>(null);

  // --- FOUNDER EDIT STATE ---
  const [founderFile, setFounderFile] = useState<File | null>(null);
  const [founderPreview, setFounderPreview] = useState<string | null>(null);

  // --- DISCOUNT STATE ---
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ code: "", discount_type: "percent", discount_value: 0, is_active: true });

  // --- SCHEDULE STATE ---
  const [scheduleScope, setScheduleScope] = useState<number | "global">("global");
  const [activeDayType, setActiveDayType] = useState<"weekday" | "weekend">("weekday");
  const [currentSlots, setCurrentSlots] = useState<string[]>([]);
  const [genStart, setGenStart] = useState("09:00");
  const [genEnd, setGenEnd] = useState("21:00");
  const [genInterval, setGenInterval] = useState(60);
  const [newDate, setNewDate] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  // --- NEW ITEM STATES ---
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ title: "", description: "", event_date: "", cover_image_url: "" });
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({ name: "", role: "", message: "", video_url: "", rating: 5, is_active: true });
  
  // --- SETTINGS STATE ---
  const [galleryCategory, setGalleryCategory] = useState("general");
  const [qrUrl, setQrUrl] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null); const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "", address: "" });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  // --- FETCH ---
  const fetchData = async () => {
    const { data: s } = await supabase.from("services").select("*").order("id"); if (s) setServices(s);
    const { data: b } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }); if (b) setBookings(b);
    const { data: sch } = await supabase.from("schedules").select("*").order("date"); if (sch) setSchedules(sch);
    const { data: t } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false }); if (t) setTestimonials(t);
    const { data: g } = await supabase.from("gallery_images").select("*").order("created_at", { ascending: false }); if (g) setGalleryImages(g);
    const { data: c } = await supabase.from("content_blocks").select("*").order("id"); if (c) setContentBlocks(c);
    const { data: e } = await supabase.from("events").select("*").order("event_date", { ascending: false }); if (e) setEvents(e);
    const { data: m } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }); if (m) setMessages(m);
    const { data: f } = await supabase.from("founder_profile").select("*").single(); if (f) { setFounderProfile(f); setFounderPreview(f.image_url); }
    const { data: cp } = await supabase.from("coupons").select("*").order("id"); if (cp) setCoupons(cp as Coupon[]);
    const { data: set } = await supabase.from("settings").select("*");
    if (set) { const map: any = {}; set.forEach(row => map[row.key] = row.value); setQrUrl(map["upi_qr"] || ""); setContactInfo({ email: map["contact_email"] || "", phone: map["contact_phone"] || "", address: map["contact_address"] || "" }); }
  };
  useEffect(() => { fetchData(); }, []);
  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(""), 3000); };
  const handleRefresh = async () => { setIsRefreshing(true); await fetchData(); setTimeout(() => setIsRefreshing(false), 500); };

  // --- HANDLERS: BOOKINGS ---
  const handleExportBookings = () => {
    const headers = ["Date", "Time", "Name", "Phone", "Email", "Service", "Status", "Payment", "UTR"];
    const rows = bookings.map(b => [b.booking_date, b.time, b.user_name, b.user_phone, b.user_email, b.service_type, b.status, b.payment_method, b.transaction_id].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };
  const handleCancelBooking = async (id: number) => { if(confirm("Cancel this booking?")) await supabase.from("bookings").update({ status: 'cancelled' }).eq('id', id); fetchData(); };
  const handleVerifyPayment = async (id: number) => { if(confirm("Confirm?")) await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id); fetchData(); };

  // --- HANDLERS: COUPONS ---
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert([newCoupon]);
    if(error) notify("Error"); else { notify("Coupon Created"); setNewCoupon({ code: "", discount_type: "percent", discount_value: 0, is_active: true }); fetchData(); }
  };
  const handleDeleteCoupon = async (id: number) => { if(confirm("Del?")) await supabase.from("coupons").delete().eq("id", id); fetchData(); };

  // --- HANDLERS: SERVICES ---
  const handleSelectService = (s: Service) => { setSelectedService(s); setFormService({ ...s }); setBenefitsInput(s.benefits ? s.benefits.join("\n") : ""); setHomePreview(s.image_url); setHomeFile(null); setBookingPreview(s.booking_image_url); setBookingFile(null); setDetailPreview(s.detail_image_url); setDetailFile(null); };
  const handleAddNewService = async () => { const { data, error } = await supabase.from("services").insert([{ title: "New Service", description: "Edit me", price: 1000, is_active: false, capacity: 1, type: "single" }]).select().single(); if (error) notify("Error"); else { notify("Created!"); await fetchData(); if(data) handleSelectService(data); } };
  const handleDeleteService = async () => { if(!selectedService || !confirm("Delete?")) return; await supabase.from("services").delete().eq("id", selectedService.id); notify("Deleted"); setSelectedService(null); fetchData(); };
  const handleToggleActive = async () => { if(!selectedService) return; const ns = !formService.is_active; setFormService({...formService, is_active: ns}); await supabase.from("services").update({ is_active: ns }).eq("id", selectedService.id); notify(ns ? "Public" : "Hidden"); fetchData(); };
  const handleSaveService = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedService) return; setLoading(true); try { const u = async (f: File | null, existing: string | undefined) => { if (!f) return existing; const n = `s-${Date.now()}-${f.name}`; await supabase.storage.from("service-images").upload(n, f); const { data } = supabase.storage.from("service-images").getPublicUrl(n); return data.publicUrl; }; const h = await u(homeFile, formService.image_url); const b = await u(bookingFile, formService.booking_image_url); const d = await u(detailFile, formService.detail_image_url); const ups = { ...formService, image_url: h, booking_image_url: b, detail_image_url: d, benefits: benefitsInput.split("\n").filter(x=>x.trim()), price: Number(formService.price), price_30: Number(formService.price_30), previous_price: Number(formService.previous_price), previous_price_30: Number(formService.previous_price_30), capacity: Number(formService.capacity) }; await supabase.from("services").update(ups).eq("id", selectedService.id); notify("Saved!"); fetchData(); router.refresh(); } catch (err: any) { notify(err.message); } finally { setLoading(false); } };

  // --- HANDLERS: FOUNDER ---
  const handleSaveFounder = async (e: React.FormEvent) => {
    e.preventDefault(); if (!founderProfile) return; setLoading(true);
    let imgUrl = founderProfile.image_url;
    if (founderFile) { const n = `founder-${Date.now()}`; await supabase.storage.from("service-images").upload(n, founderFile); const { data } = supabase.storage.from("service-images").getPublicUrl(n); imgUrl = data.publicUrl; }
    await supabase.from("founder_profile").update({ ...founderProfile, image_url: imgUrl }).eq("id", 1); notify("Updated!"); setLoading(false);
  };

  // --- HANDLERS: CONTENT, MESSAGES, TESTIMONIALS, EVENTS, SCHEDULE, SETTINGS ---
  const handleAddContent = async () => { const { data, error } = await supabase.from("content_blocks").insert([{ slug: `section-${Date.now()}`, title: "New Section", content: "...", category: "awareness" }]).select().single(); if(error) notify("Error"); else { notify("Added!"); fetchData(); if(data) setSelectedContent(data); } };
  const handleDeleteContent = async () => { if (!selectedContent || !confirm("Delete?")) return; await supabase.from("content_blocks").delete().eq("id", selectedContent.id); notify("Deleted"); setSelectedContent(null); fetchData(); };
  const handleSaveContent = async (e: React.FormEvent) => { e.preventDefault(); if(!selectedContent) return; setLoading(true); await supabase.from("content_blocks").update({ slug: selectedContent.slug, title: selectedContent.title, content: selectedContent.content }).eq("id", selectedContent.id); notify("Saved!"); fetchData(); setLoading(false); };
  const handleDeleteMessage = async (id: number) => { if(confirm("Archive this message?")) await supabase.from("contact_messages").delete().eq("id", id); notify("Deleted"); fetchData(); };
  const handleAddTestimonial = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from("testimonials").insert([newTestimonial]); if (error) notify("Error"); else { notify("Added!"); setNewTestimonial({ name: "", role: "", message: "", video_url: "", rating: 5, is_active: true }); fetchData(); } };
  const handleDeleteTestimonial = async (id: number) => { if(confirm("Del?")) await supabase.from("testimonials").delete().eq("id", id); fetchData(); };
  const toggleTestimonialVisibility = async (t: Testimonial) => { await supabase.from("testimonials").update({ is_active: !t.is_active }).eq("id", t.id); fetchData(); };
  const handleAddEvent = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); let coverUrl = newEvent.cover_image_url; if (eventFile) { const n = `event-${Date.now()}`; await supabase.storage.from("service-images").upload(n, eventFile); const { data } = supabase.storage.from("service-images").getPublicUrl(n); coverUrl = data.publicUrl; } const { error } = await supabase.from("events").insert([{ ...newEvent, cover_image_url: coverUrl }]); if (error) notify("Error"); else { notify("Event Added!"); setNewEvent({ title: "", description: "", event_date: "", cover_image_url: "" }); setEventFile(null); fetchData(); } setLoading(false); };
  const handleDeleteEvent = async (id: number) => { if(confirm("Del?")) await supabase.from("events").delete().eq("id", id); fetchData(); };
  const runGenerator = () => { const slots = []; let c = new Date(`2000-01-01T${genStart}`); const e = new Date(`2000-01-01T${genEnd}`); if (genInterval < 15) return; while (c < e) { slots.push(c.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })); c.setMinutes(c.getMinutes() + genInterval); } setCurrentSlots(slots); notify(`Generated ${slots.length}`); };
  const saveCurrentSlots = async () => { const scopeId = scheduleScope === "global" ? null : scheduleScope; const existing = schedules.find(s => s.type === activeDayType && s.service_id === scopeId); if (existing) await supabase.from("schedules").update({ slots: currentSlots }).eq("id", existing.id); else await supabase.from("schedules").insert([{ type: activeDayType, slots: currentSlots, service_id: scopeId }]); notify("Saved!"); fetchData(); };
  const removeSlot = (s: string) => setCurrentSlots(currentSlots.filter(sl => sl !== s));
  const addSingleSlot = () => { const t = prompt("Time (01:30 PM):"); if (t) setCurrentSlots([...currentSlots, t].sort()); };
  const handleAddException = async () => { if (!newDate) return; const scopeId = scheduleScope==='global'?null:scheduleScope; await supabase.from("schedules").insert([{ type: "custom", date: newDate, slots: isClosed ? [] : currentSlots, is_closed: isClosed, service_id: scopeId }]); notify("Added"); fetchData(); };
  const handleDeleteRule = async (id: number) => { if(confirm("Del?")) await supabase.from("schedules").delete().eq("id", id); fetchData(); };
  const handleUpdateQR = async () => { if (!qrFile) return; const n = `qr-${Date.now()}`; await supabase.storage.from("service-images").upload(n, qrFile); const { data } = supabase.storage.from("service-images").getPublicUrl(n); await supabase.from("settings").upsert({ key: "upi_qr", value: data.publicUrl }, { onConflict: "key" }); setQrUrl(data.publicUrl); notify("Updated"); };
  const handleSaveContact = async (e: React.FormEvent) => { e.preventDefault(); await supabase.from("settings").upsert([{ key: "contact_email", value: contactInfo.email }, { key: "contact_phone", value: contactInfo.phone }, { key: "contact_address", value: contactInfo.address }], { onConflict: "key" }); notify("Saved"); };
  const handleUploadGallery = async () => { if (!galleryFile) return; const n = `gal-${Date.now()}`; await supabase.storage.from("service-images").upload(n, galleryFile); const { data } = supabase.storage.from("service-images").getPublicUrl(n); await supabase.from("gallery_images").insert([{ image_url: data.publicUrl, category: galleryCategory }]); notify("Uploaded!"); fetchData(); };
  const handleDeleteGallery = async (id: number) => { if(confirm("Del?")) await supabase.from("gallery_images").delete().eq("id", id); fetchData(); };

  const filteredBookings = bookings.filter(b => b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || b.user_phone.includes(searchTerm) || b.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) || b.service_type.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <h1 className="font-bold text-lg">Admin</h1>
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-nowrap gap-1 bg-zinc-100 p-1 rounded-lg min-w-max">
            {["bookings", "inbox", "services", "discounts", "events", "founder", "gallery", "schedule", "content", "testimonials", "settings"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? "bg-black text-white shadow" : "text-gray-500 hover:text-black"}`}>{tab}</button>
            ))}
          </div>
        </div>
      </header>
      {notification && <div className="fixed bottom-5 right-5 left-5 md:left-auto bg-black text-white px-6 py-3 rounded-lg shadow-xl z-50 text-center md:text-left text-sm font-bold">{notification}</div>}

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* BOOKINGS */}
        {activeTab === "bookings" && (
           <div className="w-full p-4 md:p-8 overflow-y-auto">
             <div className="max-w-7xl mx-auto space-y-4">
               <div className="flex gap-4"><div className="flex-1 relative"><input type="text" placeholder="Search..." className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div><button onClick={handleExportBookings} className="px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold hover:bg-green-100">Export CSV</button><button onClick={handleRefresh} className={`px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 ${isRefreshing ? "opacity-70" : ""}`}><span className={isRefreshing ? "animate-spin" : ""}>↻</span></button></div>
               <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[800px]"><thead className="bg-gray-50 font-bold text-gray-500 border-b"><tr><th className="p-4">Date</th><th className="p-4">User</th><th className="p-4">Service</th><th className="p-4">Payment</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{filteredBookings.length > 0 ? filteredBookings.map(b => (<tr key={b.id} className={`hover:bg-gray-50 ${b.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}><td className="p-4 font-bold">{b.booking_date}<br/><span className="text-xs font-normal text-gray-500">{b.time}</span></td><td className="p-4 font-bold">{b.user_name}<div className="text-xs font-normal text-blue-600 truncate max-w-[150px]">{b.user_email}</div><div className="text-xs font-normal text-gray-500">{b.user_phone}</div></td><td className="p-4">{b.service_type}<div className="text-xs text-gray-400">{b.duration}</div></td><td className="p-4"><div className="text-xs font-bold uppercase">{b.payment_method}</div>{b.payment_method === 'QR Code' && (<div className="text-xs font-mono bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded mt-1 inline-block border border-yellow-200">UTR: {b.transaction_id}</div>)}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status==='confirmed'?'bg-green-100 text-green-700': b.status==='pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span></td><td className="p-4 flex gap-2">{(b.status === 'pending' || b.status === 'payment_review') && <button onClick={() => handleVerifyPayment(b.id)} className="text-blue-600 font-bold text-xs hover:underline">Confirm</button>}{b.status !== 'cancelled' && <button onClick={() => handleCancelBooking(b.id)} className="text-red-600 font-bold text-xs hover:underline">Cancel</button>}</td></tr>)) : (<tr><td colSpan={6} className="p-8 text-center text-gray-400">No results.</td></tr>)}</tbody></table></div></div>
             </div>
           </div>
        )}

        {/* INBOX */}
        {activeTab === "inbox" && (
            <div className="w-full p-4 md:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="font-bold text-xl">Message Inbox</h2>
                    {messages.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">No new messages.</div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map(m => (
                                <div key={m.id} className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 justify-between">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-baseline gap-3">
                                            <h3 className="font-bold text-lg">{m.name}</h3>
                                            <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-blue-600 font-medium text-sm">{m.phone}</p>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-line border">{m.message}</p>
                                    </div>
                                    <div>
                                        <button onClick={() => handleDeleteMessage(m.id)} className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">Archive</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* DISCOUNTS */}
        {activeTab === "discounts" && (
            <div className="w-full p-4 md:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="font-bold text-xl">Active Coupons</h2>
                        {coupons.map(c => (
                            <div key={c.id} className="bg-white p-4 rounded shadow-sm border flex justify-between items-center">
                                <div><span className="font-mono font-bold text-lg bg-black text-white px-2 py-1 rounded">{c.code}</span><p className="text-sm text-gray-500 mt-1">{c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</p></div>
                                <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-500 text-xs font-bold border px-3 py-1 rounded hover:bg-red-50">DELETE</button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded shadow border h-fit">
                        <h2 className="font-bold mb-4">Create Promo</h2>
                        <form onSubmit={handleAddCoupon} className="space-y-4">
                            <div><label className="label">Code</label><input className="input font-mono uppercase" required value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} /></div>
                            <div className="grid grid-cols-2 gap-2"><div><label className="label">Type</label><select className="input" value={newCoupon.discount_type} onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value as any})}><option value="percent">% Percent</option><option value="fixed">₹ Flat</option></select></div><div><label className="label">Value</label><input type="number" className="input" required value={newCoupon.discount_value} onChange={e => setNewCoupon({...newCoupon, discount_value: Number(e.target.value)})} /></div></div>
                            <button className="btn-primary w-full">Create Coupon</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* SERVICES */}
        {activeTab === "services" && (
          <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
            <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r h-48 md:h-full overflow-y-auto shrink-0">
              <button onClick={handleAddNewService} className="m-4 py-3 bg-black text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors w-[calc(100%-2rem)]">+ Add New</button>
              <div className="pb-4">{services.map(s => (<button key={s.id} onClick={() => handleSelectService(s)} className={`w-full p-4 text-left border-l-4 transition-all hover:bg-gray-50 flex justify-between items-center ${selectedService?.id === s.id ? "border-black bg-zinc-50 font-bold" : "border-transparent"} ${!s.is_active ? "opacity-50" : ""}`}><span>{s.title}</span><span className="text-[10px] bg-gray-100 px-1 rounded">{s.type === 'combo' ? '🧩' : ''}</span></button>))}</div>
            </div>
            <div className="flex-1 bg-zinc-50 p-4 md:p-8 overflow-y-auto">
              {selectedService ? (
                <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-xl shadow-sm border mb-20 md:mb-0">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 border-b pb-6 gap-4"><h2 className="text-xl md:text-2xl font-bold">Edit {selectedService.title}</h2><div className="flex gap-3 w-full md:w-auto"><button type="button" onClick={handleToggleActive} className={`flex-1 md:flex-none px-4 py-2 rounded text-xs font-bold border transition-colors ${formService.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{formService.is_active ? "● ACTIVE" : "○ HIDDEN"}</button><button type="button" onClick={handleDeleteService} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold">DELETE</button></div></div>
                  <form onSubmit={handleSaveService} className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4"><label className="label text-blue-800">Service Type:</label><select className="input w-auto font-bold" value={formService.type || 'single'} onChange={e => setFormService({...formService, type: e.target.value})}><option value="single">Single Service</option><option value="combo">🧩 Combo Package</option></select></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6 mb-6">
                        <div className="space-y-2"><label className="label">1. Home</label><div className="relative aspect-video bg-gray-100 rounded overflow-hidden group border">{homePreview && <Image src={homePreview} alt="" fill className="object-cover" unoptimized />}<label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" className="hidden" onChange={e => e.target.files?.[0] && (setHomeFile(e.target.files[0]), setHomePreview(URL.createObjectURL(e.target.files[0])))} />Change</label></div></div>
                        <div className="space-y-2"><label className="label">2. Booking</label><div className="relative aspect-[4/5] bg-gray-100 rounded overflow-hidden group border w-32 mx-auto">{bookingPreview && <Image src={bookingPreview} alt="" fill className="object-cover" unoptimized />}<label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" className="hidden" onChange={e => e.target.files?.[0] && (setBookingFile(e.target.files[0]), setBookingPreview(URL.createObjectURL(e.target.files[0])))} />Change</label></div></div>
                        <div className="space-y-2"><label className="label">3. Detail</label><div className="relative aspect-[21/9] bg-gray-100 rounded overflow-hidden group border">{detailPreview && <Image src={detailPreview} alt="" fill className="object-cover" unoptimized />}<label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" className="hidden" onChange={e => e.target.files?.[0] && (setDetailFile(e.target.files[0]), setDetailPreview(URL.createObjectURL(e.target.files[0])))} />Change</label></div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="label">Title</label><input className="input" value={formService.title} onChange={e => setFormService({...formService, title: e.target.value})} /></div><div><label className="label">Badge</label><input className="input" value={formService.badge || ""} onChange={e => setFormService({...formService, badge: e.target.value})} /></div><div className="bg-green-50 p-1 rounded"><label className="label text-green-700">Capacity</label><input type="number" className="input border-green-200" value={formService.capacity || 1} onChange={e => setFormService({...formService, capacity: Number(e.target.value)})} /></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-lg border border-blue-100"><div className="space-y-2"><h4 className="font-bold text-xs text-blue-700 uppercase">60 Min Pricing</h4><div className="flex gap-2"><input type="number" placeholder="Current" className="input" value={formService.price} onChange={e => setFormService({...formService, price: Number(e.target.value)})} /><input type="number" placeholder="Old" className="input" value={formService.previous_price || 0} onChange={e => setFormService({...formService, previous_price: Number(e.target.value)})} /></div></div><div className="space-y-2"><h4 className="font-bold text-xs text-cyan-700 uppercase">30 Min Pricing</h4><div className="flex gap-2"><input type="number" placeholder="Current" className="input" value={formService.price_30 || 0} onChange={e => setFormService({...formService, price_30: Number(e.target.value)})} /><input type="number" placeholder="Old" className="input" value={formService.previous_price_30 || 0} onChange={e => setFormService({...formService, previous_price_30: Number(e.target.value)})} /></div></div></div>
                    <div><label className="label">Short Desc</label><textarea className="input" rows={2} value={formService.description} onChange={e => setFormService({...formService, description: e.target.value})} /></div>
                    <div><label className="label">Protocol</label><textarea className="input font-mono text-sm" rows={6} value={formService.long_description || ""} onChange={e => setFormService({...formService, long_description: e.target.value})} /></div>
                    <div><label className="label">Benefits</label><textarea className="input font-mono text-sm" rows={5} value={benefitsInput} onChange={e => setBenefitsInput(e.target.value)} /></div>
                    <button disabled={loading} className="btn-primary w-full py-4 text-lg">{loading ? "Saving..." : "Save Changes"}</button>
                  </form>
                </div>
              ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12"><p>Select a service to edit</p></div>}
            </div>
          </div>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
            <div className="w-full p-4 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        {events.map(e => (
                            <div key={e.id} className="bg-white p-4 rounded shadow-sm border flex gap-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg relative overflow-hidden shrink-0"><Image src={e.cover_image_url || "https://placehold.co/100"} alt="" fill className="object-cover" unoptimized /></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{e.title}</h3>
                                        <button onClick={() => handleDeleteEvent(e.id)} className="text-red-500 text-xs font-bold border px-2 py-1 rounded hover:bg-red-50">DEL</button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">{e.event_date}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{e.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded shadow border h-fit sticky top-4">
                        <h2 className="font-bold mb-4">Add Event</h2>
                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <input className="input" placeholder="Event Title" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                            <div><label className="label">Date</label><input type="date" className="input" required value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} /></div>
                            <textarea className="input" placeholder="Description" rows={3} required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                            <div><label className="label">Cover Image</label><input type="file" onChange={e => e.target.files?.[0] && setEventFile(e.target.files[0])} className="text-sm w-full" /></div>
                            <button disabled={loading} className="btn-primary w-full">{loading ? "Uploading..." : "Publish Event"}</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* FOUNDER */}
        {activeTab === "founder" && (
            <div className="w-full p-4 md:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
                    <h2 className="font-bold text-xl mb-6">Edit Founder Profile</h2>
                    {founderProfile ? (
                        <form onSubmit={handleSaveFounder} className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/3">
                                    <label className="label">Profile Photo</label>
                                    <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border mb-2 group">
                                        {founderPreview ? <Image src={founderPreview} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-gray-400">No Image</div>}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label className="cursor-pointer text-white text-xs font-bold border border-white px-3 py-1 rounded hover:bg-white hover:text-black">
                                                Change
                                                <input type="file" className="hidden" onChange={e => { if(e.target.files?.[0]) { setFounderFile(e.target.files[0]); setFounderPreview(URL.createObjectURL(e.target.files[0])); }}} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-2/3 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="label">Name</label><input className="input" value={founderProfile.name} onChange={e => setFounderProfile({...founderProfile, name: e.target.value})} /></div>
                                        <div><label className="label">Role</label><input className="input" value={founderProfile.role} onChange={e => setFounderProfile({...founderProfile, role: e.target.value})} /></div>
                                    </div>
                                    <div><label className="label">Quote</label><textarea className="input" rows={2} value={founderProfile.quote} onChange={e => setFounderProfile({...founderProfile, quote: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="label">Value 1 (Desc)</label><input className="input" value={founderProfile.value_1_desc} onChange={e => setFounderProfile({...founderProfile, value_1_desc: e.target.value})} /></div>
                                        <div><label className="label">Value 2 (Desc)</label><input className="input" value={founderProfile.value_2_desc} onChange={e => setFounderProfile({...founderProfile, value_2_desc: e.target.value})} /></div>
                                    </div>
                                </div>
                            </div>
                            <div><label className="label">Story</label><textarea className="input font-mono text-sm leading-6" rows={8} value={founderProfile.story} onChange={e => setFounderProfile({...founderProfile, story: e.target.value})} /></div>
                            <div><label className="label">Mission</label><textarea className="input font-mono text-sm" rows={4} value={founderProfile.mission} onChange={e => setFounderProfile({...founderProfile, mission: e.target.value})} /></div>
                            <button disabled={loading} className="btn-primary w-full py-4 text-lg">{loading ? "Saving Profile..." : "Update Founder Page"}</button>
                        </form>
                    ) : <p>Loading profile...</p>}
                </div>
            </div>
        )}

        {/* GALLERY */}
        {activeTab === "gallery" && (
           <div className="w-full p-4 md:p-8 overflow-y-auto">
             <div className="max-w-5xl mx-auto">
               <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
                   <h2 className="font-bold mb-4">Upload Photo</h2>
                   <div className="flex flex-col md:flex-row gap-4 items-end">
                       <div className="flex-1 w-full"><label className="label">Select Image</label><input type="file" onChange={e => e.target.files?.[0] && setGalleryFile(e.target.files[0])} className="w-full" /></div>
                       <div className="w-full md:w-48"><label className="label">Category</label><select className="input" value={galleryCategory} onChange={e => setGalleryCategory(e.target.value)}><option value="general">General</option><option value="session">Ice Bath Session</option><option value="community">Community</option><option value="workshop">Workshop</option><option value="bts">Behind Scenes</option></select></div>
                       <button onClick={handleUploadGallery} className="btn-primary px-8 w-full md:w-auto">Upload</button>
                   </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {galleryImages.map(img => (
                    <div key={img.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                        <Image src={img.image_url} alt="" fill className="object-cover" unoptimized />
                        <div className="absolute top-2 right-2"><span className="text-[10px] font-bold bg-black/50 text-white px-2 py-1 rounded backdrop-blur-sm uppercase">{img.category || 'gen'}</span></div>
                        <button onClick={() => handleDeleteGallery(img.id)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 font-bold">DELETE</button>
                    </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* SCHEDULE */}
        {activeTab === "schedule" && (
           <div className="w-full p-4 md:p-8 overflow-y-auto">
             <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-xl shadow-sm border">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
                  <div><h2 className="font-bold text-xl md:text-2xl">Schedule Manager</h2><p className="text-zinc-500 text-sm">Define availability.</p></div>
                  <div className="w-full md:w-auto"><span className="text-xs font-bold uppercase text-gray-400 block mb-1">Editing:</span><select className="p-3 border-2 border-black rounded-lg text-sm font-bold bg-white w-full md:w-[200px]" value={scheduleScope} onChange={e => setScheduleScope(e.target.value === 'global' ? 'global' : Number(e.target.value))}><option value="global">GLOBAL DEFAULTS</option>{services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                   <div className="md:col-span-1 bg-zinc-50 p-6 rounded-xl border">
                       <h3 className="font-bold text-sm uppercase mb-4 text-zinc-400">Generator</h3>
                       <div className="space-y-4">
                           <div><label className="label">Start</label><input type="time" className="input" value={genStart} onChange={e => setGenStart(e.target.value)} /></div>
                           <div><label className="label">End</label><input type="time" className="input" value={genEnd} onChange={e => setGenEnd(e.target.value)} /></div>
                           <div><label className="label">Interval</label><select className="input" value={genInterval} onChange={e => setGenInterval(Number(e.target.value))}><option value="60">60 Mins</option><option value="30">30 Mins</option></select></div>
                           <button onClick={runGenerator} className="btn-primary w-full bg-blue-600 text-sm">Generate</button>
                       </div>
                   </div>
                   <div className="md:col-span-2">
                       <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">{["weekday", "weekend"].map((t: any) => (<button key={t} onClick={() => setActiveDayType(t)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeDayType === t ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"}`}>{t}s</button>))}</div>
                       <div className="bg-white border rounded-xl p-4 md:p-6 min-h-[300px]">{currentSlots.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-gray-300"><p>No slots set.</p></div>) : (<div className="flex flex-wrap gap-2">{currentSlots.map(slot => (<button key={slot} onClick={() => removeSlot(slot)} className="px-3 py-1.5 bg-zinc-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-sm font-mono border transition-colors flex items-center gap-2 group">{slot} <span className="text-gray-300 group-hover:text-red-400">×</span></button>))}<button onClick={addSingleSlot} className="px-3 py-1.5 border-dashed border-2 border-gray-200 rounded-lg text-sm text-gray-400 hover:border-black hover:text-black transition-colors">+ Add</button></div>)}</div>
                       <div className="mt-4 flex justify-end"><button onClick={saveCurrentSlots} className="btn-primary w-full md:w-auto px-8 bg-green-600 hover:bg-green-500">Save Schedule</button></div>
                   </div>
               </div>
               <div className="border-t pt-8">
                   <h3 className="font-bold text-lg mb-4">Exceptions</h3>
                   <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                       <div className="w-full md:flex-1"><label className="label">Date</label><input type="date" className="input" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                       <div className="w-full md:w-auto flex items-center h-10"><label className="flex items-center gap-2 font-bold text-sm text-yellow-900 cursor-pointer"><input type="checkbox" checked={isClosed} onChange={e => setIsClosed(e.target.checked)} className="w-5 h-5" /> Mark CLOSED</label></div>
                       <button onClick={handleAddException} className="btn-primary w-full md:w-auto bg-yellow-600 border-none h-10 px-6">Add</button>
                   </div>
                   <div className="space-y-2">{schedules.filter(s => s.service_id === (scheduleScope==='global'?null:scheduleScope) && s.type === 'custom').map(s => (<div key={s.id} className="flex justify-between items-center p-3 border rounded bg-white"><div className="flex items-center gap-4"><span className="font-mono font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs md:text-sm">{s.date}</span><span className="text-xs text-gray-600">{s.is_closed ? "⛔ CLOSED" : `${s.slots.length} Slots`}</span></div><button onClick={() => handleDeleteRule(s.id)} className="text-red-500 text-xs font-bold hover:underline">Delete</button></div>))}</div>
               </div>
             </div>
           </div>
        )}

        {/* CONTENT */}
        {activeTab === "content" && (
           <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
               <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r h-48 md:h-full overflow-y-auto shrink-0">
                  <button onClick={handleAddContent} className="m-4 py-3 bg-black text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors w-[calc(100%-2rem)]">+ Add New Section</button>
                  <div className="pb-4">
                      {contentBlocks.map(c => (
                          <button key={c.id} onClick={() => setSelectedContent(c)} className={`w-full p-4 text-left border-l-4 transition-all hover:bg-gray-50 ${selectedContent?.id === c.id ? "border-black bg-zinc-50 font-bold" : "border-transparent"}`}>
                              <span className="block text-sm">{c.slug}</span><span className="text-xs text-gray-400 truncate block">{c.title}</span>
                          </button>
                      ))}
                  </div>
               </div>
               <div className="flex-1 bg-zinc-50 p-4 md:p-8 overflow-y-auto">
                   {selectedContent ? (
                       <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
                           <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Edit Content</h2><button onClick={handleDeleteContent} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold hover:bg-red-100">DELETE</button></div>
                           <form onSubmit={handleSaveContent} className="space-y-6">
                               <div className="grid grid-cols-2 gap-4"><div><label className="label">Slug (ID)</label><input className="input font-mono text-blue-600" value={selectedContent.slug} onChange={e => setSelectedContent({...selectedContent, slug: e.target.value})} /></div><div><label className="label">Title</label><input className="input" value={selectedContent.title} onChange={e => setSelectedContent({...selectedContent, title: e.target.value})} /></div></div>
                               <div><label className="label">Content (Body)</label><textarea className="input font-mono text-sm leading-6" rows={12} value={selectedContent.content} onChange={e => setSelectedContent({...selectedContent, content: e.target.value})} /></div>
                               <button className="btn-primary w-full py-4 text-lg" disabled={loading}>{loading ? "Saving..." : "Update Content"}</button>
                           </form>
                       </div>
                   ) : <div className="h-full flex items-center justify-center text-gray-400"><p>Select a content block to edit.</p></div>}
               </div>
           </div>
        )}

        {/* TESTIMONIALS */}
        {activeTab === "testimonials" && (
           <div className="w-full p-4 md:p-8 overflow-y-auto">
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 {testimonials.map(t => (
                   <div key={t.id} className={`bg-white p-4 rounded shadow-sm border relative group transition-all ${!t.is_active ? 'opacity-50 grayscale' : ''}`}>
                     <div className="flex justify-between items-start mb-2">
                         <div><p className="text-sm font-bold text-black">{t.name} <span className="text-xs font-normal text-gray-500 ml-1">({t.role})</span></p><div className="flex text-yellow-400 text-xs">{"★".repeat(t.rating)}</div></div>
                         <div className="flex gap-2"><button onClick={() => toggleTestimonialVisibility(t)} className="text-xs font-bold px-2 py-1 border rounded hover:bg-gray-50">{t.is_active ? "Hide" : "Show"}</button><button onClick={() => handleDeleteTestimonial(t.id)} className="text-xs font-bold text-red-500 px-2 py-1 border border-red-100 rounded hover:bg-red-50">Del</button></div>
                     </div>
                     <p className="text-sm italic text-gray-600">"{t.message}"</p>
                     {t.video_url && (<div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block truncate max-w-full">🎥 {t.video_url}</div>)}
                   </div>
                 ))}
               </div>
               <div className="bg-white p-6 rounded shadow border h-fit sticky top-4">
                 <h2 className="font-bold mb-4">Add Testimonial</h2>
                 <form onSubmit={handleAddTestimonial} className="space-y-3">
                   <input className="input" placeholder="Name" required value={newTestimonial.name} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} />
                   <input className="input" placeholder="Role (e.g. Athlete)" value={newTestimonial.role} onChange={e => setNewTestimonial({...newTestimonial, role: e.target.value})} />
                   <div className="grid grid-cols-2 gap-2"><div><label className="label">Rating</label><select className="input" value={newTestimonial.rating} onChange={e => setNewTestimonial({...newTestimonial, rating: Number(e.target.value)})}>{[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}</select></div><div><label className="label">Active?</label><select className="input" value={newTestimonial.is_active ? "true" : "false"} onChange={e => setNewTestimonial({...newTestimonial, is_active: e.target.value === "true"})}><option value="true">Visible</option><option value="false">Hidden</option></select></div></div>
                   <textarea className="input" placeholder="Message / Review" required rows={3} value={newTestimonial.message} onChange={e => setNewTestimonial({...newTestimonial, message: e.target.value})} />
                   <div className="pt-2 border-t"><label className="label">Video URL (Optional)</label><input className="input" placeholder="YouTube / Vimeo Link" value={newTestimonial.video_url} onChange={e => setNewTestimonial({...newTestimonial, video_url: e.target.value})} /></div>
                   <button className="btn-primary w-full">Add to Wall</button>
                 </form>
               </div>
             </div>
           </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
           <div className="w-full p-4 md:p-8 overflow-y-auto">
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                 <h2 className="font-bold text-lg mb-6">Contact</h2>
                 <form onSubmit={handleSaveContact} className="space-y-4">
                   <div><label className="label">Email</label><input className="input" value={contactInfo.email} onChange={e => setContactInfo({...contactInfo, email: e.target.value})} /></div>
                   <div><label className="label">Phone</label><input className="input" value={contactInfo.phone} onChange={e => setContactInfo({...contactInfo, phone: e.target.value})} /></div>
                   <div><label className="label">Address</label><textarea className="input" rows={3} value={contactInfo.address} onChange={e => setContactInfo({...contactInfo, address: e.target.value})} /></div>
                   <button className="btn-primary w-full">Save</button>
                 </form>
               </div>
               <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border text-center">
                 <h2 className="font-bold text-lg mb-6">QR Code</h2>
                 <div className="w-48 h-48 bg-gray-100 mx-auto relative border rounded mb-4">{qrPreview ? <Image src={qrPreview} alt="New" fill className="object-contain" unoptimized /> : <Image src={qrUrl || "https://placehold.co/200"} alt="Current" fill className="object-contain" unoptimized />}</div>
                 <input type="file" onChange={e => { if(e.target.files?.[0]) { setQrFile(e.target.files[0]); setQrPreview(URL.createObjectURL(e.target.files[0])); }}} className="mb-4 text-sm w-full" />
                 {qrFile && <button onClick={handleUpdateQR} className="btn-primary w-full">Save New QR</button>}
               </div>
             </div>
           </div>
        )}

      </main>
      <style jsx>{` .input { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; } .label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 0.25rem; } .btn-primary { background: #000; color: #fff; font-weight: 700; padding: 0.75rem; border-radius: 0.5rem; } .btn-primary:hover { opacity: 0.8; } `}</style>
    </div>
  );
}