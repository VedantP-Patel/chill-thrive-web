"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON LOAD
  useEffect(() => {
    const fetchBookings = async () => {
      // "SELECT * FROM bookings ORDER BY created_at DESC"
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching:", error);
      else setBookings(data || []);
      
      setLoading(false);
    };

    fetchBookings();
  }, []);

  if (loading) return <div className="p-10">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Admin Command Center</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Service</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-4">{booking.booking_date}</td>
                  <td className="p-4 font-bold">{booking.full_name}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {booking.service_type}
                    </span>
                  </td>
                  <td className="p-4">{booking.phone}</td>
                  <td className="p-4 text-green-600 font-bold">Confirmed</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {bookings.length === 0 && (
            <div className="p-10 text-center text-gray-500">No bookings found yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}