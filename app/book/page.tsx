"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Import the driver

export default function BookingPage() {
  const [loading, setLoading] = useState(false); // Status LED (Is it sending?)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Ice Bath",
    date: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true); // Turn on "Sending" LED

    // 1. TRANSMIT DATA TO SUPABASE
    const { data, error } = await supabase
      .from('bookings') // The specific memory bank
      .insert([
        {
          full_name: formData.name,      // Map Form -> DB Column
          email: formData.email,
          phone: formData.phone,
          service_type: formData.service,
          booking_date: formData.date,
        },
      ]);

    setLoading(false); // Turn off "Sending" LED

    // 2. CHECK SIGNAL STATUS
    if (error) {
      console.error("Transmission Failed:", error);
      alert("Error: " + error.message);
    } else {
      alert("✅ Success! Booking stored in Database.");
      // Optional: Reset form
      setFormData({ ...formData, name: "", email: "", phone: "" }); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Book Your Session
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              placeholder="Patel Vedant"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              placeholder="vedant@svnit.ac.in"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* SERVICE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
            <select
              name="service"
              className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white"
              value={formData.service}
              onChange={handleChange}
            >
              <option value="Ice Bath">Ice Bath Therapy</option>
              <option value="Jacuzzi">Jacuzzi Therapy</option>
              <option value="Steam">Steam Bath</option>
              <option value="Combo">Full Recovery Combo</option>
            </select>
          </div>

          {/* DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
            <input
              type="date"
              name="date"
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading} // Disable button while sending
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg mt-4 disabled:bg-blue-300"
          >
            {loading ? "Sending..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}