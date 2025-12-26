"use client"; // This tells Next.js: "This page allows user interaction (clicks/typing)"

import { useState } from "react";

export default function BookingPage() {
  // --- STATE (RAM) ---
  // This holds the data while the user types.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Ice Bath",
    date: "",
  });

  // This function updates the RAM when the user types
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // This triggers when they click "Confirm Booking"
  const handleSubmit = (e: any) => {
    e.preventDefault(); // Stop the page from reloading
    console.log("Sending to Database:", formData); // Debugging output
    alert("Simulation: Booking request sent! (Database pending)");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Book Your Session
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* NAME INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="Patel Vedant"
              onChange={handleChange}
            />
          </div>

          {/* EMAIL INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="vedant@svnit.ac.in"
              onChange={handleChange}
            />
          </div>

          {/* PHONE INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="+91 98765 43210"
              onChange={handleChange}
            />
          </div>

          {/* SERVICE SELECTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
            <select
              name="service"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-white"
              onChange={handleChange}
            >
              <option value="Ice Bath">Ice Bath Therapy</option>
              <option value="Jacuzzi">Jacuzzi Therapy</option>
              <option value="Steam">Steam Bath</option>
              <option value="Combo">Full Recovery Combo</option>
            </select>
          </div>

          {/* DATE SELECTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
            <input
              type="date"
              name="date"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              onChange={handleChange}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg mt-4"
          >
            Confirm Booking
          </button>

        </form>
      </div>
    </div>
  );
}