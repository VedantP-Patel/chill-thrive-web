"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence, Variants } from "framer-motion"; // <--- Added 'Variants'

// --- ANIMATION VARIANTS ---
// Explicitly typed as 'Variants' to fix the build error
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut" // TypeScript now knows this is a valid Easing type
    } 
  }
};

export default function ContactPage() {
  // ... rest of your component code remains exactly the same ...

// --- 1. TYPE DEFINITIONS ---
type Booking = { 
  id: number; user_name: string; user_phone: string; user_email: string;
  service_type: string; booking_date: string; time: string; 
  status: string; payment_method: string; transaction_id?: string; 
  total_amount: number; duration: string; created_at: string; 
  coupon_code?: string; discount_amount?: number;
};

type ContactMessage = { 
  id: number; 
  name: string; 
  phone: string; 
  email: string; // <--- This was missing!
  message: string; 
  created_at: string; 
};

// 🔒 NEW SUB-TYPE
type ServiceVariant = {
  id: string;          // Unique ID for the row
  duration: string;    // e.g. "90 Mins"
  price: number;       // e.g. 2500
  old_price: number;   // e.g. 3000
  active: boolean;     // Enable/Disable specific duration
};

// --- TYPES ---
type Service = {
  id: number;
  title: string;
  description: string;
  type: string;
  image_url: string;
  detail_image_url?: string;
  booking_image_url?: string;
  price: number;
  previous_price?: number;
  price_30?: number;           // Ensure these exist if used
  previous_price_30?: number;  // Ensure these exist if used
  capacity: number;
  is_active: boolean;
  // ✅ NEW FIELDS ADDED HERE
  badge?: string;
  benefits?: string[];
  variants?: any[];
};

type Testimonial = { 
  id: number; name: string; role: string; message: string; rating: number; is_active: boolean; 
};

type Coupon = { 
  id: number; code: string; discount_value: number; type: "percent" | "flat"; is_active: boolean; 
};

type Founder = { 
  id: number; name: string; role: string; bio: string; image_url: string; 
};

export default function AdminPage() {
  const router = useRouter();

  // =========================================
  //           1. UNIFIED STATE KERNEL
  // =========================================
  
  // System
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchTerm, setSearchTerm] = useState("");

  // Data Banks
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<any>({});

// --- FOUNDER STATE (SMART V4.1) ---
  const [founderProfile, setFounderProfile] = useState<any>({
    name: "", role: "", quote: "", story: "", mission: "", image_url: "",
    valuesList: [] // <--- Virtual Array for UI
  });
  const [founderImageFile, setFounderImageFile] = useState<File | null>(null);

// Load & Map Data (V4.2 - READS ICONS)
  useEffect(() => {
    const loadFounder = async () => {
        const { data } = await supabase.from("founder_profile").select("*").single();
        if (data) {
            const extractedValues = [];
            if (data.value_1_title) extractedValues.push({ title: data.value_1_title, desc: data.value_1_desc, icon: data.value_1_icon || "🧬" });
            if (data.value_2_title) extractedValues.push({ title: data.value_2_title, desc: data.value_2_desc, icon: data.value_2_icon || "💎" });
            if (data.value_3_title) extractedValues.push({ title: data.value_3_title, desc: data.value_3_desc, icon: data.value_3_icon || "🔥" });
            
            setFounderProfile({ ...data, valuesList: extractedValues });
        }
    };
    if (activeTab === 'founder') loadFounder();
  }, [activeTab]);
  
  // Filters
  const [bookingFilter, setBookingFilter] = useState<'pending' | 'upcoming' | 'history'>('pending');

  // Service Editor
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceFiles, setServiceFiles] = useState<{ home: File | null, detail: File | null, book: File | null }>({ home: null, detail: null, book: null });

  // Extras
  const [uploadingQr, setUploadingQr] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_value: 0, type: 'percent', is_active: true });
  const [newTestimonial, setNewTestimonial] = useState({ name: "", role: "", message: "", rating: 5, is_active: true });
  const [founderFile, setFounderFile] = useState<File | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  // Reschedule Logic
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [smartSlots, setSmartSlots] = useState<string[]>([]);
  const [calculatingSlots, setCalculatingSlots] = useState(false);

  // 1. Load Settings (Converts DB Rows to Object)
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("settings").select("*");
      if (data) {
        const map: any = {};
        data.forEach((row: any) => map[row.key] = row.value);
        setSettings(map);
      }
    };
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  // 1. Load Schedules
  useEffect(() => {
    const loadSchedules = async () => {
      const { data } = await supabase.from("schedules").select("*").order("id");
      if (data) setSchedules(data);
    };
    if (activeTab === 'settings') loadSchedules();
  }, [activeTab]);

  // 2. Smart Slot Generator (Helper)
  const generateSlots = (startStr: string, endStr: string) => {
    const slots = [];
    let current = parseInt(startStr.split(":")[0]); // e.g., 9
    const end = parseInt(endStr.split(":")[0]) + 12; // e.g., 9 PM -> 21
    
    // Simple 1-hour generator (9 AM to 9 PM)
    for (let i = current; i < end; i++) {
        const hour = i > 12 ? i - 12 : i;
        const ampm = i >= 12 ? "PM" : "AM";
        // Format: "9:00 AM"
        slots.push(`${hour}:00 ${ampm}`);
    }
    return slots;
  };

  // 3. Save Schedule
  const handleSaveSchedule = async (type: string, start: string, end: string, isClosed: boolean) => {
    setScheduleLoading(true);
    try {
        const newSlots = generateSlots(start, end);
        
        // Update DB where type matches ('weekday' or 'weekend')
        const { error } = await supabase
            .from("schedules")
            .update({ slots: newSlots, is_closed: isClosed })
            .eq("type", type);

        if (error) throw error;
        
        // Refresh Local State
        const { data } = await supabase.from("schedules").select("*").order("id");
        if (data) setSchedules(data);

        alert(`✅ ${type.toUpperCase()} Schedule Updated!`);
    } catch (err: any) {
        alert("❌ Error: " + err.message);
    } finally {
        setScheduleLoading(false);
    }
  };

  // =========================================
  //           2. LOGIC ENGINE
  // =========================================

  // --- SYNC PIPELINE (FETCH ALL DATA) ---
  const handleRefresh = async () => {
    setLoading(true); setIsRefreshing(true);
    console.log("[PROTOCOL 12B]: Syncing RAM with Remote Disk...");

    try {
      const [svc, bks, msgs, stg, tst, cpn, fnd] = await Promise.all([
        supabase.from('services').select('*').order('id', { ascending: true }),
        supabase.from('bookings').select('*, coupon_code, transaction_id, discount_amount').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('testimonials').select('*').order('id'),
        supabase.from('coupons').select('*').order('id'),
        supabase.from('founder_profile').select('*').single()
      ]);

      if (svc.data) setServices(svc.data);
      if (bks.data) setBookings(bks.data);
      if (msgs.data) setMessages(msgs.data);
      if (tst.data) setTestimonials(tst.data);
      if (cpn.data) setCoupons(cpn.data);
      if (fnd.data) setFounderProfile(fnd.data);

      if (stg.data) {
        const map: any = {};
        stg.data.forEach((item: any) => map[item.key] = item.value);
        setSettings(map);
      }
      
      console.log("✅ Sync Complete.");
    } catch (err: any) {
      console.error("SYNC ERROR:", err.message);
    } finally {
      setLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { handleRefresh(); }, []);


  // --- HELPER: FILE UPLOAD ---
  const uploadFile = async (file: File, bucket: string = "assets") => {
    const name = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(name, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(name);
    return data.publicUrl;
  };

  // --- HELPER: NOTIFICATIONS ---
  const sendNotification = async (type: string, booking: any, extra: any = {}) => {
      const isEmail = settings.notify_email_enabled !== 'false';
      const isSms = settings.notify_sms_enabled !== 'false';
      const email = booking.user_email?.trim();
      const phone = booking.user_phone?.trim();
      const name = booking.user_name || "Client";

      let subject = "", body = "";
      
      if (type === 'confirmation') {
          subject = `CONFIRMED: ${booking.service_type}`;
          body = `Hi ${name}, your booking is confirmed for ${booking.booking_date} at ${booking.time}.`;
      } else if (type === 'cancellation') {
          subject = `CANCELLED: ${booking.service_type}`;
          body = `Hi ${name}, your booking on ${booking.booking_date} has been cancelled.`;
      } else if (type === 'reschedule') {
          subject = `UPDATED: Booking Moved`;
          body = `Hi ${name}, your booking is moved to ${extra.newDate} at ${extra.newTime}.`;
      }

      if (isEmail && email) window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      if (isSms && phone) window.open(`sms:${phone}?body=${encodeURIComponent(body)}`, '_blank');
  };


  // --- SERVICE LOGIC (TOGGLE) ---
  const toggleServiceActive = async (service: any) => {
    const newStatus = !service.is_active;
    setServices(services.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s)); // Optimistic
    await supabase.from('services').update({ is_active: newStatus }).eq('id', service.id);
  };

// --- SERVICE LOGIC (SAVE - FIXED) ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setLoading(true);

    try {
      // 1. Create a copy of the data
      let finalData: any = { 
        ...editingService,
        price: Number(editingService.price || 0),
        previous_price: Number(editingService.previous_price || 0),
        price_30: Number(editingService.price_30 || 0),
        previous_price_30: Number(editingService.previous_price_30 || 0),
        capacity: Number(editingService.capacity || 1)
      };

      // 🛑 CRITICAL FIX: Remove UI-only variables that don't exist in DB
      delete finalData.temp_benefit; 

      // 2. Image Uploads
      const fileKeys = ['home', 'detail', 'book'];
      const dbKeys = ['image_url', 'detail_image_url', 'booking_image_url'];

      // Note: Ensure your bucket is named 'services' or 'assets' based on your Supabase Storage
      const BUCKET_NAME = 'services'; 

      for (let i = 0; i < fileKeys.length; i++) {
        const fileKey = fileKeys[i] as keyof typeof serviceFiles;
        const dbKey = dbKeys[i];
        const file = serviceFiles[fileKey];

        if (file) {
          const fileName = `svc-${Date.now()}-${i}.${file.name.split('.').pop()}`;
          const filePath = `${fileName}`; 
          
          const { error: uploadError, data } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
          finalData[dbKey] = urlData.publicUrl;
        }
      }

// 3. Insert or Update
      if (finalData.id === 0) {
        // INSERT MODE
        delete finalData.id; // Remove 0, let DB generate ID
        const { error } = await supabase.from('services').insert([finalData]);
        if (error) throw error;
      } else {
        // UPDATE MODE
        const serviceId = finalData.id; // 1. Save ID for the selector
        delete finalData.id;            // 2. Remove ID from the payload (CRITICAL FIX)
        
        const { error } = await supabase.from('services').update(finalData).eq('id', serviceId);
        if (error) throw error;
      }

      // 4. Cleanup
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceFiles({ home: null, detail: null, book: null });
      
      // Refresh Data (ensure you have this function or logic to re-fetch)
      const { data: refreshed } = await supabase.from('services').select('*').order('id');
      if (refreshed) setServices(refreshed);
      
      alert("✅ Service Saved Successfully!");

    } catch (error: any) {
      console.error("Save Error:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

// 2. Smart QR Upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingQr(true);
    try {
      const file = e.target.files[0];
      const fileName = `qr-${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload to 'assets' bucket
      const { error: uploadError } = await supabase.storage.from("assets").upload(fileName, file);
      if (uploadError) throw uploadError;
      
      // Get URL & Update State
      const { data } = supabase.storage.from("assets").getPublicUrl(fileName);
      setSettings({ ...settings, upi_qr: data.publicUrl });
      alert("✅ QR Uploaded! Don't forget to click Save.");
    } catch (err: any) {
      alert("❌ Upload Failed: " + err.message);
    } finally {
      setUploadingQr(false);
    }
  };

// 3. Bulk Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert Object back to DB Rows
      const updates = Object.keys(settings).map(key => ({
        key: key,
        value: settings[key]
      }));

      const { error } = await supabase.from("settings").upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      
      alert("✅ System Configuration Saved!");
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Booking Actions
  const handleVerifyPayment = async (id: number) => {
    if(!confirm("Confirm payment?")) return;
    const { data } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id).select();
    if(data) sendNotification('confirmation', data[0]);
    handleRefresh();
  };
  const handleCancelBooking = async (id: number) => {
    if(!confirm("Cancel booking?")) return;
    const { data } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id).select();
    if(data) sendNotification('cancellation', data[0]);
    handleRefresh();
  };
  const handleMarkDone = async (id: number) => {
    await supabase.from('bookings').update({ status: 'done' }).eq('id', id);
    handleRefresh();
  };
  const handleDeleteMessage = async (id: number) => {
    if(!confirm("Delete message?")) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    handleRefresh();
  };
  
  // Coupon Actions
  const handleAddCoupon = async (e: React.FormEvent) => {
     e.preventDefault();
     await supabase.from('coupons').insert([{...newCoupon, is_active: true}]);
     setIsCouponModalOpen(false);
     handleRefresh();
  };
  const deleteCoupon = async (id: number) => {
    if(confirm("Delete Coupon?")) await supabase.from("coupons").delete().eq("id", id);
    handleRefresh();
  };

  // Testimonial Actions
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("testimonials").insert([newTestimonial]);
    setNewTestimonial({ name: "", role: "", message: "", rating: 5, is_active: true });
    handleRefresh();
  };
  const deleteTestimonial = async (id: number) => {
     if(confirm("Delete Review?")) await supabase.from("testimonials").delete().eq("id", id);
     handleRefresh();
  };
  
// --- FOUNDER SAVE LOGIC (V4.2 - SAVES ICONS) ---
  const handleSaveFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        let updates: any = { 
            ...founderProfile,
            // Reset columns first
            value_1_title: null, value_1_desc: null, value_1_icon: null,
            value_2_title: null, value_2_desc: null, value_2_icon: null,
            value_3_title: null, value_3_desc: null, value_3_icon: null
        };

        // Map Array back to Columns (Including Icons)
        if (founderProfile.valuesList[0]) {
            updates.value_1_title = founderProfile.valuesList[0].title;
            updates.value_1_desc = founderProfile.valuesList[0].desc;
            updates.value_1_icon = founderProfile.valuesList[0].icon;
        }
        if (founderProfile.valuesList[1]) {
            updates.value_2_title = founderProfile.valuesList[1].title;
            updates.value_2_desc = founderProfile.valuesList[1].desc;
            updates.value_2_icon = founderProfile.valuesList[1].icon;
        }
        if (founderProfile.valuesList[2]) {
            updates.value_3_title = founderProfile.valuesList[2].title;
            updates.value_3_desc = founderProfile.valuesList[2].desc;
            updates.value_3_icon = founderProfile.valuesList[2].icon;
        }
        
        delete updates.valuesList; // Clean up

        // 1. Upload Image
        if (founderImageFile) {
            const fileName = `founder-${Date.now()}.${founderImageFile.name.split('.').pop()}`;
            const { data, error } = await supabase.storage.from("assets").upload(fileName, founderImageFile);
            if (error) throw error;
            const { data: urlData } = supabase.storage.from("assets").getPublicUrl(fileName);
            updates.image_url = urlData.publicUrl;
        }

        // 2. Save
        const { error } = await supabase.from("founder_profile").upsert(updates);
        if (error) throw error;

        alert("✅ Founder Profile & Icons Updated!");
    } catch (err: any) {
        alert("❌ Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // Reschedule Logic
  const openReschedule = (b: any) => { 
      setRescheduleTarget(b); 
      setRescheduleDate(b.booking_date); 
      setRescheduleTime(b.time); 
      calculateAvailability(b.booking_date, b);
  };
  
  const calculateAvailability = async (date: string, booking: any) => {
      setCalculatingSlots(true);
      setSmartSlots([]);
      // Stub for slot calculation logic - extend as needed
      // For now, allow generic slots if no logic provided
      setSmartSlots(["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "05:00 PM", "06:00 PM", "07:00 PM"]);
      setCalculatingSlots(false);
  };

  const confirmReschedule = async () => {
    if (!rescheduleTarget) return;
    await supabase.from('bookings').update({ booking_date: rescheduleDate, time: rescheduleTime }).eq('id', rescheduleTarget.id);
    sendNotification('reschedule', rescheduleTarget, { newDate: rescheduleDate, newTime: rescheduleTime });
    setRescheduleTarget(null);
    handleRefresh();
  };

  // Filter Logic
  const filteredBookings = bookings.filter(b => {
    const s = (b.status || 'pending').toLowerCase();
    if (bookingFilter === 'pending') return ['pending', 'payment_review'].includes(s);
    if (bookingFilter === 'upcoming') return ['confirmed', 'booked', 'active'].includes(s);
    if (bookingFilter === 'history') return ['done', 'cancelled', 'rejected'].includes(s);
    return true;
  });

  // --- DYNAMIC PRICING LOGIC ---
  
  // 1. Add a new empty row
  const addVariant = () => {
    const newVariant = {
      id: Date.now().toString(), // Simple temp ID
      duration: "",
      price: 0,
      old_price: 0,
      active: true
    };
    setEditingService({
      ...editingService,
      variants: [...(editingService.variants || []), newVariant]
    });
  };

  // 2. Remove a row
  const removeVariant = (id: string) => {
    setEditingService({
      ...editingService,
      variants: editingService.variants.filter((v: any) => v.id !== id)
    });
  };

  // 3. Update a specific field in a row
  const updateVariant = (id: string, field: string, value: any) => {
    const updated = editingService.variants.map((v: any) => 
      v.id === id ? { ...v, [field]: value } : v
    );
    setEditingService({ ...editingService, variants: updated });
  };
  // --- 6. RENDER UI ---
  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-20 md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col items-center md:items-start py-8 md:px-6 shrink-0 z-20">
        <div className="mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl"></div>
            <span className="hidden md:block font-black text-xl tracking-tighter">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-2 w-full">
            {[
                { id: "bookings", label: "Bookings", icon: "📅" },
                { id: "inbox", label: "Inbox", icon: "📥" },
                { id: "services", label: "Services", icon: "⚡" },
                { id: "founder", label: "Founder", icon: "👤" },
                { id: "testimonials", label: "Reviews", icon: "⭐" },
                { id: "coupons", label: "Coupons", icon: "🎟️" },
                { id: "settings", label: "Settings", icon: "⚙️" },
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-white shadow-md text-black font-bold" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                >
                    <span className="text-xl">{item.icon}</span>
                    <span className="hidden md:block text-sm font-bold uppercase tracking-wide">{item.label}</span>
                </button>
            ))}
        </nav>
        <button onClick={() => router.push("/")} className="mt-auto flex items-center gap-2 text-slate-400 hover:text-black transition-colors font-bold text-xs uppercase tracking-widest">
            <span>←</span> <span className="hidden md:inline">Exit</span>
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative">
        
{/* TAB 1: BOOKINGS PAGE */}
        {activeTab === "bookings" && (
           <div className="w-full h-full overflow-y-auto bg-slate-50/50 relative">
             <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
             <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 relative z-10">
               
               {/* Controls Header */}
               <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                   <div>
                       <h2 className="font-black text-4xl tracking-tighter text-slate-900 mb-1">BOOKINGS</h2>
                       <p className="text-slate-400 font-medium text-sm">Manage sessions & Verify payments.</p>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-white/50">
                       <input 
                         type="text" 
                         placeholder="Search..." 
                         className="w-full pl-4 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-bold text-slate-700 outline-none" 
                         value={searchTerm} 
                         onChange={(e) => setSearchTerm(e.target.value)} 
                       />
                       <button onClick={handleRefresh} className={`px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 ${isRefreshing?"animate-spin":""}`}>↻</button>
                   </div>
               </div>

               {/* --- FILTER NAVIGATION (USES NEW VARIABLE) --- */}
               <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                   {['pending', 'upcoming', 'history'].map((tab) => (
                     <button
                       key={tab}
                       type="button"
                       onClick={() => setBookingFilter(tab as any)} // 🔒 UPDATES FILTER, NOT PAGE
                       className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                         bookingFilter === tab 
                         ? 'bg-white text-black shadow-md ring-1 ring-black/5' 
                         : 'text-slate-400 hover:text-slate-600'
                       }`}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>
                 <div className="hidden md:block text-right">
                   <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{bookingFilter} Queue</span>
                   <span className="text-2xl font-black text-slate-900 leading-none">{filteredBookings.length}</span>
                 </div>
               </div>

{/* --- 3. INTELLIGENT DATA LIST (OVERDUE AWARE) --- */}
               <div className="flex flex-col gap-3">
                 {filteredBookings.length > 0 ? (
                   filteredBookings.map((b) => {
                     // ⏳ TIME TRAVEL LOGIC
                     const bookingDate = new Date(b.booking_date);
                     const today = new Date();
                     today.setHours(0, 0, 0, 0); // Reset time to midnight for fair comparison
                     
                     // Check if booking is in the past (before today) AND not resolved
                     const isPast = bookingDate < today;
                     const isUnresolved = !['done', 'cancelled', 'rejected'].includes((b.status || '').toLowerCase());
                     const isOverdue = isPast && isUnresolved;

                     return (
                       <div 
                         key={b.id} 
                         className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4 group relative overflow-hidden ${
                           isOverdue 
                           ? 'bg-red-50/40 border-red-300 ring-1 ring-red-100' // 🚨 OVERDUE STYLE
                           : 'bg-white border-slate-200'
                         }`}
                       >
                         {/* 🚨 OVERDUE WARNING STRIP */}
                         {isOverdue && (
                           <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                         )}
                         
                         {/* DATE CAPSULE */}
                         <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg shrink-0 text-white ${isOverdue ? 'bg-red-500 shadow-red-200' : 'bg-slate-900 shadow-slate-200'} shadow-lg`}>
                           <span className="text-[9px] font-bold uppercase opacity-80">
                             {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-GB', {month:'short'}) : 'NOV'}
                           </span>
                           <span className="text-xl font-bold leading-none">
                             {b.booking_date ? new Date(b.booking_date).getDate() : '00'}
                           </span>
                         </div>

                         {/* CLIENT IDENTITY */}
                         <div className="flex-1 min-w-[180px] text-center md:text-left">
                           <div className="flex items-center justify-center md:justify-start gap-2">
                             <h3 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">
                               {b.user_name || "Unknown Client"}
                             </h3>
                             {/* 🚨 OVERDUE BADGE */}
                             {isOverdue && (
                               <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded-full animate-pulse border border-red-200">
                                 ⚠ Action Required
                               </span>
                             )}
                           </div>
                           <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1 text-xs text-slate-500 font-medium">
                             <span className="flex items-center gap-1 bg-slate-50/50 px-2 py-0.5 rounded">📞 {b.user_phone || "--"}</span>
                             <span className="hidden lg:flex items-center gap-1 bg-slate-50/50 px-2 py-0.5 rounded">✉️ {b.user_email || "--"}</span>
                           </div>
                         </div>

                         {/* SERVICE DETAILS */}
                         <div className="md:w-48 hidden md:block border-l border-slate-200/50 pl-4">
                           <p className="font-bold text-slate-800 text-xs truncate">{b.service_type || "General Session"}</p>
                           <p className={`text-[10px] font-mono mt-0.5 ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                             🕒 {b.time} ({b.duration || '60m'})
                           </p>
                         </div>

{/* FINANCIAL AUDIT (WITH COUPON TRACKER) */}
                         <div className={`md:w-40 text-right px-3 py-2 rounded-lg border min-w-[140px] flex flex-col justify-center ${isOverdue ? 'bg-white border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                           
                           {/* Row 1: Method & Price */}
                           <div className="flex justify-between items-center gap-2">
                             <span className={`text-[9px] font-black uppercase ${b.payment_method?.toLowerCase().includes('qr') ? 'text-blue-600' : 'text-green-600'}`}>
                               {b.payment_method?.toLowerCase().includes('qr') ? 'UPI' : 'CASH'}
                             </span>
                             <span className="text-sm font-black text-slate-900">₹{b.total_amount}</span>
                           </div>

                           {/* Row 2: Coupon Code (Only shows if applied) */}
                           {b.coupon_code && (
                             <div className="flex justify-end items-center gap-1 mt-0.5">
                               <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase tracking-wide truncate max-w-[100px]">
                                 🎟 {b.coupon_code}
                               </span>
                             </div>
                           )}

                           {/* Row 3: UTR / Reference */}
                           <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5 select-all" title={b.transaction_id}>
                             {b.transaction_id || 'N/A'}
                           </div>
                         </div>

                         {/* --- ACTION BUTTONS --- */}
                         <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 justify-end md:pl-4 md:border-l md:border-slate-200/50 min-w-fit">
                           
                           {bookingFilter === 'pending' && (
                             <>
                               <button type="button" onClick={(e) => { e.stopPropagation(); handleVerifyPayment(b.id); }} className="px-4 py-2 bg-black text-white font-bold text-[10px] uppercase rounded-lg hover:bg-zinc-800 shadow-lg whitespace-nowrap active:scale-95 transition-transform">Approve</button>
                               <button type="button" onClick={(e) => { e.stopPropagation(); handleCancelBooking(b.id); }} className="px-3 py-2 border border-red-200 text-red-500 font-bold text-[10px] uppercase rounded-lg hover:bg-red-50 active:scale-95 transition-transform">✕</button>
                             </>
                           )}

                           {bookingFilter === 'upcoming' && (
                             <>
                               <button type="button" onClick={(e) => { e.stopPropagation(); openReschedule(b); }} className="px-3 py-2 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg hover:bg-slate-200 active:scale-95 transition-transform">Move</button>
                               <button type="button" onClick={(e) => { e.stopPropagation(); handleMarkDone(b.id); }} className="px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-blue-700 shadow-lg whitespace-nowrap active:scale-95 transition-transform">Done</button>
                               {/* Cancel for Upcoming */}
                               <button type="button" onClick={(e) => { e.stopPropagation(); handleCancelBooking(b.id); }} className="px-3 py-2 border border-red-200 text-red-500 font-bold text-[10px] uppercase rounded-lg hover:bg-red-50" title="Cancel Booking">✕</button>
                             </>
                           )}

                           {bookingFilter === 'history' && (
                              <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase border ${(b.status||'').toLowerCase().includes('done') ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-400'}`}>
                                {(b.status||'').toLowerCase().includes('done') ? 'Completed' : 'Cancelled'}
                              </span>
                           )}
                         </div>

                       </div> 
                       
                     );
                   })
                 ) : (
                   <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No {bookingFilter} Bookings Found</p>
                   </div>
                 )}
               </div>

               {/* MODAL & EXTRAS STAY HERE */}
               {rescheduleTarget && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                   <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl scale-100 border border-zinc-100">
                     <h3 className="text-xl font-black mb-1 text-center">SMART MOVE</h3>
                     <p className="text-xs text-slate-500 text-center mb-6">Rescheduling <strong>{rescheduleTarget.user_name}</strong></p>
                     <div className="space-y-4 mb-8">
                       <input type="date" min={new Date().toLocaleDateString('en-CA')} value={rescheduleDate} onChange={e => { setRescheduleDate(e.target.value); setRescheduleTime(""); calculateAvailability(e.target.value, rescheduleTarget); }} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                       <select value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} disabled={calculatingSlots || smartSlots.length === 0} className="w-full p-4 rounded-xl font-bold text-sm outline-none bg-blue-50 text-blue-900">
                           <option value="">{calculatingSlots ? "Calculating..." : "Select Smart Slot"}</option>
                           {smartSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                       </select>
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => setRescheduleTarget(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl uppercase tracking-wider hover:bg-slate-50 text-xs">Cancel</button>
                       <button onClick={confirmReschedule} className="flex-1 py-4 bg-black text-white font-bold rounded-xl uppercase tracking-wider hover:bg-zinc-800 shadow-lg text-xs">Confirm</button>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>
        )}

{/* TAB 2: INBOX (REDESIGNED) */}
        {activeTab === "inbox" && (
           <div className="w-full h-full overflow-y-auto bg-slate-50/50 relative">
             <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none"></div>
             <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8 relative z-10">
               
               {/* HEADER CONTROLS */}
               <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                   <div>
                       <h2 className="font-black text-4xl tracking-tighter text-slate-900 mb-1">INBOX</h2>
                       <p className="text-slate-400 font-medium text-sm">Client inquiries & support tickets.</p>
                   </div>
                   
                   {/* Refresh Button */}
                   <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:block">
                           {messages.length} Messages
                       </span>
                       <button 
                           onClick={handleRefresh} 
                           className={`px-4 py-3 bg-white border border-white/50 shadow-sm rounded-xl font-bold hover:bg-slate-50 text-slate-900 transition-all ${isRefreshing ? "animate-spin" : ""}`}
                       >
                           ↻
                       </button>
                   </div>
               </div>

               {/* MESSAGES LIST */}
               <div className="space-y-4">
                   {messages.length > 0 ? (
                       messages.map((msg) => (
                           <div key={msg.id} className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all relative">
                               <div className="flex flex-col md:flex-row gap-6 items-start">
                                   
                                   {/* AVATAR / INITIALS */}
                                   <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 uppercase">
                                       {msg.name ? msg.name.substring(0, 2) : "??"}
                                   </div>

                                   {/* CONTENT */}
                                   <div className="flex-1 space-y-3 w-full">
                                       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                           <div>
                                               <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{msg.name || "Unknown Sender"}</h3>
                                               <p className="text-xs font-bold text-slate-400">
                                                   {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                               </p>
                                           </div>
                                           
                                           {/* QUICK ACTIONS */}
                                           <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                                               {msg.phone && (
                                                   <a 
                                                       href={`tel:${msg.phone}`} 
                                                       className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                   >
                                                       📞 Call
                                                   </a>
                                               )}
                                               <button 
                                                   onClick={() => handleDeleteMessage(msg.id)} 
                                                   className="px-4 py-2 bg-white border border-red-100 text-red-400 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                                               >
                                                   Delete
                                               </button>
                                           </div>
                                       </div>

                                       {/* MESSAGE BODY */}
                                       <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 text-sm font-medium leading-relaxed border border-slate-100">
                                           "{msg.message}"
                                       </div>

                                       {/* CONTACT FOOTER */}
                                       <div className="flex flex-wrap gap-4 pt-2">
                                           {msg.phone && (
                                               <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                   <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                   {msg.phone}
                                               </span>
                                           )}
                                           {msg.email && (
                                               <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                   <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                   {msg.email}
                                               </span>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))
                   ) : (
                       // EMPTY STATE
                       <div className="py-24 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                           <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                               📫
                           </div>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No New Messages</p>
                       </div>
                   )}
               </div>
             </div>
           </div>
        )}
                
{/* TAB 3: SERVICES (V3.9.1 - COLLISION FIX) */}
        {activeTab === "services" && (
            <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">Services</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Asset Configuration V3.9.1</p>
                    </div>
                    <button 
                        onClick={() => { 
                            setEditingService({ 
                                id: 0, title: "", duration: "", badge: "",
                                variants: [], benefits: [], 
                                price: 0, previous_price: 0, 
                                price_30: 0, previous_price_30: 0, description: "", 
                                image_url: "", detail_image_url: "", booking_image_url: "", 
                                is_active: true, type: "single", capacity: 1,
                                temp_benefit: ""
                            }); 
                            setServiceFiles({ home: null, detail: null, book: null }); 
                            setIsServiceModalOpen(true); 
                        }} 
                        className="px-8 py-4 bg-black text-white font-black rounded-2xl uppercase tracking-tighter text-xs hover:invert transition-all shadow-xl"
                    >
                        + New Service
                    </button>
                </div>
                
                {/* SERVICE GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col">
                            
                            {/* Card Header (Collision-Proof Layout) */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4"> {/* Added padding-right to separate from button */}
                                    
                                    {/* Badge (Inline - No Overlap) */}
                                    {s.badge ? (
                                        <span className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm mb-2">
                                            {s.badge}
                                        </span>
                                    ) : (
                                        <div className="h-6"></div> // Spacer to keep alignment if needed
                                    )}

                                    <h3 className="font-black text-2xl tracking-tighter text-slate-800 uppercase truncate leading-none">{s.title}</h3>
                                    
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase italic">{s.type}</span>
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase">Cap: {s.capacity}</span>
                                    </div>
                                </div>

                                <button onClick={() => { setEditingService({...s, temp_benefit: ""}); setIsServiceModalOpen(true); }} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shrink-0">
                                    <span className="text-[10px] font-black uppercase">Edit</span>
                                </button>
                            </div>

                            {/* Description Snippet */}
                            <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 min-h-[2.5em] leading-relaxed">
                                {s.description || "No public description available."}
                            </p>

                            {/* Benefits Preview */}
                            <div className="flex flex-wrap gap-1 mb-6">
                                {(s.benefits || []).slice(0, 3).map((b: string, i: number) => (
                                    <span key={i} className="text-[8px] font-bold uppercase bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                        ✓ {b}
                                    </span>
                                ))}
                            </div>

                            {/* Pricing Preview */}
                            <div className="mt-auto space-y-2 mb-6">
                                {(s.variants || []).filter((v:any) => v.active).slice(0, 2).map((v: any) => (
                                    <div key={v.id} className="flex justify-between items-center bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-black uppercase text-slate-500">⏳ {v.duration}</span>
                                        <div className="font-black text-slate-900 text-xs">
                                            ₹{v.price}
                                            {v.old_price > 0 && <span className="ml-2 text-[9px] line-through text-slate-300">₹{v.old_price}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{s.is_active ? 'Live' : 'Offline'}</span>
                                </div>
                                <button onClick={() => toggleServiceActive(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${s.is_active ? 'bg-zinc-100 text-zinc-900' : 'bg-black text-white'}`}>
                                    {s.is_active ? 'Take Offline' : 'Bring Live'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* --- EDITOR MODAL --- */}
                {isServiceModalOpen && editingService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsServiceModalOpen(false)} />

                        {/* Modal Container */}
                        <form onSubmit={handleSaveService} className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                            
                            {/* A. STICKY HEADER */}
                            <div className="flex-none flex justify-between items-center p-8 pb-4 bg-white z-50 border-b border-slate-50">
                                <div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                        Editor Protocol
                                    </span>
                                    <h3 className="font-black text-3xl tracking-tighter uppercase text-slate-900 mt-1">
                                        {editingService.id === 0 ? "Create Asset" : "Modify Asset"}
                                    </h3>
                                </div>
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 font-bold transition-all flex items-center justify-center">✕</button>
                            </div>

                            {/* B. SCROLLABLE CONTENT */}
                            <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                                
                                {/* 1. Identity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Service Title</label>
                                        <input className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-xl text-slate-900 outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300" placeholder="e.g. Cryotherapy" value={editingService.title} onChange={e => setEditingService({...editingService, title: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Badge Label</label>
                                        <div className="relative">
                                            <input className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-sm text-blue-600 outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 uppercase tracking-wider" placeholder="e.g. BEST SELLER" value={editingService.badge || ""} onChange={e => setEditingService({...editingService, badge: e.target.value})} />
                                            {editingService.badge && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs">🏷️</span>}
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Public Description</label>
                                        <textarea 
                                            rows={3} 
                                            className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-sm text-slate-700 outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 resize-none leading-relaxed" 
                                            placeholder="Write a compelling description..." 
                                            value={editingService.description || ""} 
                                            onChange={e => setEditingService({...editingService, description: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Type</label>
                                        <div className="relative">
                                            <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500 appearance-none cursor-pointer" value={editingService.type} onChange={e => setEditingService({...editingService, type: e.target.value})}>
                                                <option value="single">Single Session</option>
                                                <option value="combo">Combo Package</option>
                                            </select>
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">▼</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Capacity</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" value={editingService.capacity} onChange={e => setEditingService({...editingService, capacity: Number(e.target.value)})} />
                                    </div>
                                </div>

                                {/* 2. Benefits */}
                                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h4 className="font-black text-sm uppercase text-blue-900 tracking-tight">Key Benefits</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 p-4 bg-white rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500 transition-all placeholder:text-slate-300"
                                            placeholder="Type benefit (e.g. 'Detox') and press Enter..."
                                            value={editingService.temp_benefit || ""}
                                            onChange={e => setEditingService({...editingService, temp_benefit: e.target.value})}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (editingService.temp_benefit?.trim()) {
                                                        const newBenefits = [...(editingService.benefits || []), editingService.temp_benefit.trim()];
                                                        setEditingService({...editingService, benefits: newBenefits, temp_benefit: ""});
                                                    }
                                                }
                                            }}
                                        />
                                        <button type="button" onClick={() => { if (editingService.temp_benefit?.trim()) { const newBenefits = [...(editingService.benefits || []), editingService.temp_benefit.trim()]; setEditingService({...editingService, benefits: newBenefits, temp_benefit: ""}); }}} className="px-6 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs hover:bg-blue-700 transition-all">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                        {(editingService.benefits || []).map((b: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-xs font-bold text-blue-600 shadow-sm border border-blue-100 animate-in zoom-in-95 duration-200">
                                                ✓ {b}
                                                <button type="button" onClick={() => { const newBenefits = editingService.benefits.filter((_:any, idx:number) => idx !== i); setEditingService({...editingService, benefits: newBenefits}); }} className="w-4 h-4 rounded-full bg-blue-50 text-blue-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-[10px]">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Pricing Matrix */}
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-5">
                                    <div className="flex justify-between items-center px-2">
                                        <h4 className="font-black text-sm uppercase text-slate-800 tracking-tight">Pricing Matrix</h4>
                                        <button type="button" onClick={() => { const newVariant = { id: Date.now().toString(), duration: "", price: 0, old_price: 0, active: true }; setEditingService({ ...editingService, variants: [...(editingService.variants || []), newVariant] }); }} className="px-5 py-3 bg-black text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"><span>+</span> Add Option</button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingService.variants || []).map((v: any) => (
                                            <div key={v.id} className="grid grid-cols-12 gap-3 bg-white p-3 rounded-2xl shadow-sm items-center border border-slate-100 hover:border-blue-200 transition-all">
                                                <div className="col-span-5 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2"><span className="text-lg opacity-30">⏳</span><input placeholder="e.g. 60 Mins" className="w-full bg-transparent font-bold text-sm outline-none placeholder:text-slate-300" value={v.duration} onChange={(e) => { const updated = editingService.variants.map((vt:any) => vt.id === v.id ? { ...vt, duration: e.target.value } : vt); setEditingService({ ...editingService, variants: updated }); }} /></div>
                                                <div className="col-span-3 flex items-center gap-1 bg-slate-50 rounded-xl px-3 py-2"><span className="text-xs font-bold text-slate-400">₹</span><input type="number" placeholder="0" className="w-full bg-transparent font-black text-sm outline-none text-green-700 placeholder:text-slate-300" value={v.price} onChange={(e) => { const updated = editingService.variants.map((vt:any) => vt.id === v.id ? { ...vt, price: Number(e.target.value) } : vt); setEditingService({ ...editingService, variants: updated }); }} /></div>
                                                <div className="col-span-2 flex items-center gap-1 bg-slate-50 rounded-xl px-3 py-2 border border-transparent focus-within:border-red-100 transition-colors"><span className="text-[10px] font-bold text-slate-300 line-through">₹</span><input type="number" placeholder="Old" className="w-full bg-transparent font-bold text-xs text-slate-400 outline-none placeholder:text-slate-200" value={v.old_price || ''} onChange={(e) => { const updated = editingService.variants.map((vt:any) => vt.id === v.id ? { ...vt, old_price: Number(e.target.value) } : vt); setEditingService({ ...editingService, variants: updated }); }} /></div>
                                                <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={() => { const updated = editingService.variants.map((vt:any) => vt.id === v.id ? { ...vt, active: !vt.active } : vt); setEditingService({ ...editingService, variants: updated }); }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${v.active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>{v.active ? '●' : '○'}</button><button type="button" onClick={() => setEditingService({ ...editingService, variants: editingService.variants.filter((vt:any) => vt.id !== v.id) })} className="w-8 h-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center font-bold transition-all">✕</button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Visual Experience */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Visual Experience</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        {/* Home Card (16:9) */}
                                        <label className="cursor-pointer group relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center overflow-hidden">
                                            {serviceFiles['home'] ? <img src={URL.createObjectURL(serviceFiles['home'] as File)} className="absolute inset-0 w-full h-full object-cover" /> : editingService.image_url ? <img src={editingService.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="text-center"><span className="text-2xl block mb-1 opacity-20">🖼️</span><span className="text-[8px] font-black uppercase text-slate-400">Home Card</span></div>}
                                            <input type="file" className="hidden" onChange={e => e.target.files && setServiceFiles({...serviceFiles, home: e.target.files[0]})} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span></div>
                                        </label>
                                        {/* Detail Banner (16:9) */}
                                        <label className="cursor-pointer group relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center overflow-hidden">
                                            {serviceFiles['detail'] ? <img src={URL.createObjectURL(serviceFiles['detail'] as File)} className="absolute inset-0 w-full h-full object-cover" /> : editingService.detail_image_url ? <img src={editingService.detail_image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="text-center"><span className="text-2xl block mb-1 opacity-20">🌄</span><span className="text-[8px] font-black uppercase text-slate-400">Detail Banner</span></div>}
                                            <input type="file" className="hidden" onChange={e => e.target.files && setServiceFiles({...serviceFiles, detail: e.target.files[0]})} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span></div>
                                        </label>
                                        {/* Booking Thumb (1:1) */}
                                        <label className="cursor-pointer group relative aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center overflow-hidden">
                                            {serviceFiles['book'] ? <img src={URL.createObjectURL(serviceFiles['book'] as File)} className="absolute inset-0 w-full h-full object-cover" /> : editingService.booking_image_url ? <img src={editingService.booking_image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="text-center"><span className="text-2xl block mb-1 opacity-20">📱</span><span className="text-[8px] font-black uppercase text-slate-400">Book Thumb</span></div>}
                                            <input type="file" className="hidden" onChange={e => e.target.files && setServiceFiles({...serviceFiles, book: e.target.files[0]})} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* C. FIXED FOOTER */}
                            <div className="flex-none p-6 bg-white border-t border-slate-50 z-50">
                                <button type="submit" className="w-full py-5 bg-black text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                                    <span>💾</span> Commit Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        )}
        
{/* TAB 4: FOUNDER (V4.2 - CUSTOM ICONS ENABLED) */}
        {activeTab === "founder" && (
            <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header */}
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h2 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">Founder Identity</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Personal Brand Configuration V4.2</p>
                        </div>
                        <button 
                            onClick={handleSaveFounder} 
                            disabled={loading} 
                            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-tighter text-xs hover:bg-blue-700 transition-all shadow-xl flex items-center gap-2"
                        >
                            {loading ? "Syncing..." : "💾 Save Changes"}
                        </button>
                    </div>

                    <form className="space-y-8 pb-20">
                        
                        {/* 1. VISUAL IDENTITY & CORE INFO */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-8">
                            
                            {/* Photo Upload */}
                            <div className="md:col-span-4">
                                <label className="block cursor-pointer group relative aspect-[3/4] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-400 overflow-hidden transition-all">
                                    {founderImageFile ? (
                                        <img src={URL.createObjectURL(founderImageFile)} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : founderProfile.image_url ? (
                                        <img src={founderProfile.image_url} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 group-hover:text-blue-400">
                                            <span className="text-4xl mb-2">📸</span>
                                            <span className="text-[10px] font-black uppercase">Upload Portrait</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Change Photo</span>
                                    </div>
                                    <input type="file" className="hidden" onChange={e => e.target.files && setFounderImageFile(e.target.files[0])} />
                                </label>
                            </div>

                            {/* Core Details */}
                            <div className="md:col-span-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Full Name</label>
                                        <input className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={founderProfile.name || ""} onChange={e => setFounderProfile({...founderProfile, name: e.target.value})} placeholder="e.g. Alex Vikram" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Role Title</label>
                                        <input className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-bold text-sm text-blue-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all uppercase tracking-wider" value={founderProfile.role || ""} onChange={e => setFounderProfile({...founderProfile, role: e.target.value})} placeholder="e.g. FOUNDER & LEAD ARCHITECT" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Hero Quote</label>
                                    <textarea rows={2} className="w-full p-4 pl-6 bg-slate-50 rounded-2xl font-medium text-lg italic text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" value={founderProfile.quote || ""} onChange={e => setFounderProfile({...founderProfile, quote: e.target.value})} placeholder="The hook that appears on the hero section..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">The Origin Story</label>
                                    <textarea rows={8} className="w-full p-6 bg-slate-50 rounded-2xl text-sm font-medium text-slate-600 leading-relaxed outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" value={founderProfile.story || ""} onChange={e => setFounderProfile({...founderProfile, story: e.target.value})} placeholder="Tell your journey here..." />
                                </div>
                            </div>
                        </div>

                        {/* 2. BRAND DNA (Mission & Values) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Mission */}
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 rounded-full blur-3xl group-hover:bg-blue-500/50 transition-all"></div>
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Core Mission</h3>
                                <textarea rows={6} className="w-full bg-transparent text-xl md:text-2xl font-black leading-tight outline-none placeholder:text-slate-600 resize-none border-none focus:ring-0" value={founderProfile.mission || ""} onChange={e => setFounderProfile({...founderProfile, mission: e.target.value})} placeholder="ENTER MISSION STATEMENT..." />
                            </div>

                            {/* Values Config (Dynamic Array with Icons) */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand Values</h4>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (founderProfile.valuesList.length < 3) {
                                                setFounderProfile({
                                                    ...founderProfile, 
                                                    valuesList: [...founderProfile.valuesList, { title: "", desc: "", icon: "✨" }] 
                                                });
                                            } else {
                                                alert("Max 3 values allowed for this layout.");
                                            }
                                        }}
                                        className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded-lg uppercase hover:bg-slate-800 transition-all shadow-md"
                                    >
                                        + Add Value
                                    </button>
                                </div>

                                {/* Dynamic Values List */}
                                {founderProfile.valuesList && founderProfile.valuesList.map((val: any, idx: number) => (
                                    <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3 relative group animate-in slide-in-from-right-4 duration-300">
                                        
                                        {/* Row Header */}
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                {/* EDITABLE ICON INPUT */}
                                                <input 
                                                    className="w-10 h-10 rounded-lg bg-slate-50 text-center text-xl cursor-pointer hover:bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                                    value={val.icon || "✨"}
                                                    onChange={e => {
                                                        const newList = [...founderProfile.valuesList];
                                                        newList[idx].icon = e.target.value;
                                                        setFounderProfile({ ...founderProfile, valuesList: newList });
                                                    }}
                                                    title="Click to edit emoji"
                                                />
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Value 0{idx + 1}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newList = founderProfile.valuesList.filter((_:any, i:number) => i !== idx);
                                                    setFounderProfile({ ...founderProfile, valuesList: newList });
                                                }}
                                                className="w-6 h-6 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all font-bold text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        
                                        {/* Inputs */}
                                        <input 
                                            className="w-full bg-slate-50 p-3 rounded-xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" 
                                            value={val.title} 
                                            onChange={e => {
                                                const newList = [...founderProfile.valuesList];
                                                newList[idx].title = e.target.value;
                                                setFounderProfile({ ...founderProfile, valuesList: newList });
                                            }} 
                                            placeholder="VALUE TITLE" 
                                        />
                                        <input 
                                            className="w-full bg-transparent p-2 text-xs font-bold text-slate-500 outline-none border-b border-dashed border-slate-200 focus:border-blue-400" 
                                            value={val.desc} 
                                            onChange={e => {
                                                const newList = [...founderProfile.valuesList];
                                                newList[idx].desc = e.target.value;
                                                setFounderProfile({ ...founderProfile, valuesList: newList });
                                            }} 
                                            placeholder="Short description..." 
                                        />
                                    </div>
                                ))}

                                {/* Empty State */}
                                {(!founderProfile.valuesList || founderProfile.valuesList.length === 0) && (
                                    <div className="text-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Values Defined</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        )}

        {/* TAB 5: REVIEWS (High-Fidelity) */}
        {activeTab === "testimonials" && (
            <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">Client Voices</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Testimonial Management</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT: ADD FORM */}
                        <form onSubmit={handleAddTestimonial} className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl h-fit relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 blur-[60px] opacity-50 pointer-events-none"></div>
                            
                            <h3 className="font-black text-2xl uppercase mb-6 relative z-10">Add Review</h3>
                            
                            <div className="space-y-4 relative z-10">
                                <input placeholder="Client Name" className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold text-white placeholder:text-zinc-600 focus:border-blue-500 outline-none transition-all" value={newTestimonial.name} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} />
                                <textarea rows={4} placeholder="Their experience..." className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold text-white placeholder:text-zinc-600 focus:border-blue-500 outline-none transition-all resize-none" value={newTestimonial.message} onChange={e => setNewTestimonial({...newTestimonial, message: e.target.value})} />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-500">Rating:</span>
                                    {[1,2,3,4,5].map(star => (
                                        <button type="button" key={star} onClick={() => setNewTestimonial({...newTestimonial, rating: star})} className={`text-xl transition-transform hover:scale-125 ${newTestimonial.rating >= star ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</button>
                                    ))}
                                </div>
                                <button className="w-full py-4 bg-white text-black font-black rounded-xl uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all mt-2">
                                    Publish Review
                                </button>
                            </div>
                        </form>

                        {/* RIGHT: REVIEW GRID */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {testimonials.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="absolute top-6 right-6 text-4xl text-slate-100 font-serif leading-none">"</div>
                                    
                                    <div className="flex items-center gap-1 mb-3 text-xs">
                                        {Array(t.rating).fill(0).map((_, i) => <span key={i}>⭐</span>)}
                                    </div>
                                    
                                    <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed line-clamp-3">
                                        {t.message}
                                    </p>
                                    
                                    <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                        <div>
                                            <p className="font-black text-slate-900 uppercase text-sm">{t.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verified Client</p>
                                        </div>
                                        <button 
                                            onClick={() => deleteTestimonial(t.id)} 
                                            className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {testimonials.length === 0 && (
                                <div className="col-span-2 flex flex-col items-center justify-center p-12 text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                    <span className="text-4xl mb-2">💬</span>
                                    <span className="text-xs font-black uppercase tracking-widest">No reviews yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 6: COUPONS (High-Fidelity) */}
        {activeTab === "coupons" && (
            <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">Coupons</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Discount Logic & Codes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT: CREATOR */}
                        <form onSubmit={handleAddCoupon} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 h-fit">
                            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center gap-3">
                                <span className="text-2xl">🎟️</span>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-yellow-600 tracking-widest">Generator</p>
                                    <p className="text-xs font-bold text-yellow-800">Create new promo codes here.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Code</label>
                                    <input placeholder="e.g. SUMMER20" className="w-full p-4 bg-slate-50 rounded-2xl text-lg font-mono font-black uppercase text-slate-900 outline-none focus:ring-2 focus:ring-black" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Value</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newCoupon.discount_value} onChange={e => setNewCoupon({...newCoupon, discount_value: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Type</label>
                                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none appearance-none" value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}>
                                            <option value="percent">% Off</option>
                                            <option value="flat">₹ Flat</option>
                                        </select>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-black text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition-transform">
                                    Issue Coupon
                                </button>
                            </div>
                        </form>

                        {/* RIGHT: ACTIVE TICKETS */}
                        <div className="lg:col-span-2 space-y-4">
                            {coupons.map(c => (
                                <div key={c.id} className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row items-center md:items-stretch group">
                                    {/* Left Stub */}
                                    <div className="bg-slate-900 text-white p-6 md:w-32 flex flex-col items-center justify-center text-center relative">
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
                                        <span className="text-2xl mb-1">🏷️</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Active</span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                                        <div className="text-center md:text-left">
                                            <p className="font-mono text-3xl font-black text-slate-900 tracking-tighter uppercase">{c.code}</p>
                                            <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
                                                {c.type === 'percent' ? `${c.discount_value}% Discount` : `₹${c.discount_value} Flat Off`}
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => deleteCoupon(c.id)} 
                                            className="px-6 py-3 bg-red-50 text-red-500 font-bold rounded-xl text-xs uppercase hover:bg-red-500 hover:text-white transition-all w-full md:w-auto"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {coupons.length === 0 && (
                                <div className="text-center p-12 text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                    <span className="text-xs font-black uppercase tracking-widest">No active coupons</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

{/* TAB 7: SETTINGS (V6.2 - GAP-FREE MASONRY LAYOUT) */}
        {activeTab === "settings" && (
            <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    
                    {/* Header */}
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h2 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">System Config</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Global Variables & Payment Gateways V6.2</p>
                        </div>
                    </div>

                    {/* GAP-FREE LAYOUT: Two Explicit Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 items-start">
                        
                        {/* === LEFT COLUMN STACK === */}
                        <div className="space-y-8">
                            
                            {/* 1. PUBLIC IDENTITY */}
                            <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 relative group">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">📢</span>
                                    <h3 className="font-black text-xl tracking-tight uppercase">Public Contact</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Support Phone</label>
                                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={settings.contact_phone || ""} onChange={e => setSettings({...settings, contact_phone: e.target.value})} placeholder="+91..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Support Email</label>
                                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={settings.contact_email || ""} onChange={e => setSettings({...settings, contact_email: e.target.value})} placeholder="help@..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Physical Address</label>
                                        <textarea className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm min-h-[80px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" rows={3} value={settings.contact_address || ""} onChange={e => setSettings({...settings, contact_address: e.target.value})} placeholder="Full Address..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest flex justify-between">
                                            <span>Map Embed Link</span>
                                            {settings.map_url && <span className="text-green-500">● Valid</span>}
                                        </label>
                                        <input 
                                            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs text-slate-600 focus:text-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" 
                                            value={settings.map_url || ""} 
                                            onChange={e => {
                                                let val = e.target.value;
                                                if (val.includes('<iframe') && val.includes('src="')) {
                                                    const srcMatch = val.match(/src="([^"]+)"/);
                                                    if (srcMatch && srcMatch[1]) val = srcMatch[1];
                                                }
                                                setSettings({...settings, map_url: val});
                                            }} 
                                            placeholder="Paste Google Maps Embed URL" 
                                        />
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all">Save Contact Info</button>
                            </form>

                            {/* 3. PAYMENT GATEWAY */}
                            <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">💳</span>
                                    <h3 className="font-black text-xl tracking-tight uppercase">Payments</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">Business UPI ID</label>
                                        <div className="relative">
                                            <input 
                                                className="w-full pl-10 p-4 bg-blue-50/50 rounded-xl font-bold font-mono text-sm border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none text-blue-900" 
                                                value={settings.upi_id || ""} 
                                                onChange={e => setSettings({...settings, upi_id: e.target.value})} 
                                                placeholder="business@oksbi" 
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">⚡</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-3 tracking-widest">QR Code Asset</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                                                {settings.upi_qr ? (
                                                    <img src={settings.upi_qr} alt="QR" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 uppercase text-center leading-tight">No QR</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <label className={`block w-full py-4 text-center rounded-xl border-2 border-dashed font-bold text-[10px] uppercase tracking-widest cursor-pointer transition-all ${uploadingQr ? "bg-slate-100 border-slate-300 text-slate-400" : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400"}`}>
                                                    {uploadingQr ? "Uploading..." : "Upload New QR"}
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploadingQr} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-black text-white font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:bg-zinc-800 shadow-xl transition-all">
                                    Update Payment
                                </button>
                            </form>

                        </div>

                        {/* === RIGHT COLUMN STACK === */}
                        <div className="space-y-8">
                            
                            {/* 2. OPERATIONAL HOURS */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-2 relative z-10">
                                    <span className="text-2xl">⏳</span>
                                    <h3 className="font-black text-xl tracking-tight uppercase">Operational Hours</h3>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {['weekday', 'weekend'].map((type) => {
                                        const s = schedules.find(sch => sch.type === type) || { is_closed: false, slots: [] };
                                        const day = new Date().getDay();
                                        const isWeekendToday = day === 0 || day === 6;
                                        const isActiveToday = type === 'weekend' ? isWeekendToday : !isWeekendToday;

                                        let startVal = "9:00"; let endVal = "9:00"; 
                                        if (s.slots && s.slots.length > 0) {
                                            const first = s.slots[0];
                                            const [t1, m1] = first.split(' ');
                                            let [h1, min1] = t1.split(':').map(Number);
                                            if (m1 === 'PM' && h1 !== 12) h1 += 12;
                                            startVal = `${h1}:${min1.toString().padStart(2, '0')}`;

                                            const last = s.slots[s.slots.length - 1];
                                            const [t2, m2] = last.split(' ');
                                            let [h2, min2] = t2.split(':').map(Number);
                                            if (m2 === 'PM' && h2 !== 12) h2 += 12;
                                            h2 += 1; if (h2 > 12) h2 -= 12; 
                                            endVal = `${h2}:${min2.toString().padStart(2, '0')}`;
                                        }

                                        return (
                                            <div key={type} className={`p-6 rounded-3xl border transition-all ${isActiveToday ? "bg-blue-50 border-blue-200 ring-4 ring-blue-50" : "bg-slate-50 border-slate-100"}`}>
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <span className={`font-black uppercase tracking-widest text-sm ${isActiveToday ? "text-blue-900" : "text-slate-900"}`}>
                                                            {type === 'weekday' ? 'Mon - Fri' : 'Sat - Sun'}
                                                        </span>
                                                        {isActiveToday && <span className="ml-2 text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">⚡ Today</span>}
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${s.is_closed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                                        {s.is_closed ? "Closed" : "Active"}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Open</label>
                                                        <select id={`${type}-start`} className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-transparent focus:border-blue-300 transition-all" defaultValue={startVal}>
                                                            {[6,7,8,9,10,11,12].map(h => <option key={h} value={`${h}:00`}>{h}:00 AM</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Close</label>
                                                        <select id={`${type}-end`} className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-transparent focus:border-blue-300 transition-all" defaultValue={endVal}>
                                                            {[1,2,3,4,5,6,7,8,9,10,11].map(h => <option key={h} value={`${h}:00`}>{h}:00 PM</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button onClick={() => { const start = (document.getElementById(`${type}-start`) as HTMLSelectElement).value; const end = (document.getElementById(`${type}-end`) as HTMLSelectElement).value; handleSaveSchedule(type, start, end, false); }} className="flex-1 py-3 bg-black text-white font-bold rounded-xl text-xs uppercase hover:bg-zinc-800 transition-all">Update</button>
                                                    <button onClick={() => handleSaveSchedule(type, '9:00', '9:00', !s.is_closed)} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase transition-all border ${s.is_closed ? "bg-white border-green-200 text-green-600" : "bg-white border-red-200 text-red-600"}`}>{s.is_closed ? "Open Shop" : "Close Shop"}</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 4. NOTIFICATIONS */}
                            <form onSubmit={handleSaveSettings} className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6 relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🔔</span>
                                    <h3 className="font-black text-xl tracking-tight uppercase">Alerts</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                                        <div><span className="font-bold block">Email Prompts</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Via `mailto:`</span></div>
                                        <input type="checkbox" className="w-6 h-6 rounded-md accent-blue-500" checked={settings.notify_email_enabled !== 'false'} onChange={e => setSettings({...settings, notify_email_enabled: e.target.checked ? 'true' : 'false'})} />
                                    </div>
                                    <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                                        <div><span className="font-bold block">SMS Prompts</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Via `sms:`</span></div>
                                        <input type="checkbox" className="w-6 h-6 rounded-md accent-blue-500" checked={settings.notify_sms_enabled !== 'false'} onChange={e => setSettings({...settings, notify_sms_enabled: e.target.checked ? 'true' : 'false'})} />
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:bg-blue-500 shadow-lg transition-all">Update Protocols</button>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}