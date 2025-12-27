"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? "bg-slate-900/90 backdrop-blur-md h-16 shadow-md border-b border-white/5" // Scrolled: Compact height (16 = 64px)
          : "bg-transparent h-20" // Top: Taller height (20 = 80px)
      }`}
    >
      {/* ADDED: "h-full" ensures the container fills the height of the nav
         ADDED: "items-center" forces strict vertical centering
      */}
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-white tracking-wide hover:opacity-90 transition flex items-center">
          Chill<span className="text-blue-300">Thrive</span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex space-x-8 items-center h-full">
          {["Home", "Services", "About"].map((item) => (
            <Link 
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className="text-white/90 hover:text-white transition-all text-sm font-medium uppercase tracking-widest hover:tracking-[0.15em] flex items-center h-full"
            >
              {item}
            </Link>
          ))}
          
          {/* BUTTON FIXES:
             1. Reduced padding (py-2) to make it smaller
             2. Added flex items-center to center text inside
          */}
          <Link 
            href="/book" 
            className={`rounded-full border border-white/30 text-white hover:bg-white hover:text-blue-900 transition-all duration-300 font-medium backdrop-blur-sm flex items-center justify-center ${
                scrolled ? "px-5 py-1.5 text-xs" : "px-6 py-2 text-sm"
            }`}
          >
            Book Now
          </Link>
        </div>

        {/* MOBILE TOGGLE */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 flex flex-col space-y-4 shadow-2xl">
          {["Home", "Services", "About"].map((item) => (
            <Link 
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className="text-white/80 hover:text-white py-2 border-b border-white/5"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </Link>
          ))}
          <Link href="/book" className="text-center bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg" onClick={() => setIsOpen(false)}>
            Book Session
          </Link>
        </div>
      )}
    </nav>
  );
}