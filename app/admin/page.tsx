"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR ADDING SERVICES ---
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
  });

  // FETCH DATA
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookings(data);
    setLoading(false);
  };

  // --- NEW FUNCTION: ADD SERVICE TO DB ---
  const handleAddService = async (e: any) => {
    e.preventDefault();
    
    // 1. INSERT into 'services' table
    const { error } = await supabase
      .from("services")
      .insert([
        {
          title: newService.title,
          description: newService.description,
          price: Number(newService.price),
          duration_min: 60, // Default duration
        }
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("✅ Service Launched!");
      setNewService({ title: "", description: "", price: "" }); // Reset form
      // Note: In a real app, we would refresh the list, but this is enough to test.
    }
  };

  if (loading) return <div className="p-10">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <h1 className="text-3xl font-bold text-blue-900">Admin Command Center</h1>

        {/* --- SECTION 1: SERVICE LAUNCH PAD --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600">
          <h2 className="text-xl font-bold mb-4">🚀 Launch New Service</h2>
          <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-bold text-gray-600">Service Title</label>
              <input 
                type="text" 
                placeholder="e.g. Gold Ice Bath" 
                className="w-full p-2 border rounded text-black"
                value={newService.title}
                onChange={(e) => setNewService({...newService, title: e.target.value})}
                required
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-sm font-bold text-gray-600">Description</label>
              <input 
                type="text" 
                placeholder="Short description..." 
                className="w-full p-2 border rounded text-black"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                required
              />
            </div>
            <div className="w-32">
              <label className="text-sm font-bold text-gray-600">Price (₹)</label>
              <input 
                type="number" 
                placeholder="500" 
                className="w-full p-2 border rounded text-black"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: e.target.value})}
                required
              />
            </div>
            <button className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700">
              Launch
            </button>
          </form>
        </div>

        {/* --- SECTION 2: BOOKING MONITOR --- */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold">Incoming Bookings</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Service</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-blue-50">
                  <td className="p-4">{booking.booking_date}</td>
                  <td className="p-4 font-bold">{booking.full_name}</td>
                  <td className="p-4">{booking.service_type}</td>
                  <td className="p-4 text-green-600 font-bold">Confirmed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}