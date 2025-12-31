"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Footer() {
  // State for dynamic data
  const [contactInfo, setContactInfo] = useState({
    email: "recovery@chillthrive.in",
    phone: "+91 98765 43210", 
    address: "Vadodara, Gujarat"
  });

  // Fetch real data from Admin Settings
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("settings").select("*");
      if (data) {
        const map: any = {};
        data.forEach(item => map[item.key] = item.value);
        setContactInfo({
            email: map["contact_email"] || "recovery@chillthrive.in",
            phone: map["contact_phone"] || "+91 98765 43210",
            address: map["contact_address"] || "Vadodara, Gujarat"
        });
      }
    };
    fetchData();
  }, []);

  return (
    <footer className="bg-black text-white pt-20 pb-10 border-t border-zinc-900 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1 bg-gradient-to-r from-transparent via-blue-900 to-transparent opacity-50 blur-sm"></div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* BRAND (Span 5) */}
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter">CHILL.THRIVE</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              The premier recovery lab in Vadodara. Science-backed protocols designed to reset your body and sharpen your mind.
            </p>
            <div className="flex gap-4">
                <Link href="/book" className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-cyan-400 transition-all">Book Now</Link>
            </div>
          </div>

          {/* LINKS (Span 3) */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Explore</h3>
            <ul className="space-y-4 text-sm font-medium text-zinc-300">
              <li><Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-cyan-400 transition-colors">Protocols</Link></li>
              <li><Link href="/gallery" className="hover:text-cyan-400 transition-colors">Visuals</Link></li>
              <li><Link href="/founder" className="hover:text-cyan-400 transition-colors">Our Story</Link></li>
            </ul>
          </div>

          {/* CONTACT (Span 4) */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-zinc-600 mt-1">📍</span>
                <span className="whitespace-pre-line leading-relaxed">{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-zinc-600">📞</span>
                <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition-colors">{contactInfo.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-zinc-600">✉️</span>
                <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition-colors">{contactInfo.email}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
            <p>© {new Date().getFullYear()} Chill Thrive Recovery. All rights reserved.</p>
            <div className="flex gap-6">
                <Link href="/admin" className="hover:text-zinc-400 transition-colors">Admin Login</Link>
                <Link href="#" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-zinc-400 transition-colors">Terms</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}