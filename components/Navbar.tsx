"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Close Mobile Menu on Route Change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 3. Hide Navbar on Admin or Login
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) return null;

  // Logic: Solid White if Scrolled OR Not Home OR Mobile Menu Open
  const isSolid = isScrolled || pathname !== "/" || isMobileMenuOpen;

  // 4. Links Configuration (ADDED AWARENESS)
  const links = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Gallery", path: "/gallery" },
    { name: "Awareness", path: "/awareness" }, // <--- NEW LINK ADDED
    { name: "Track", path: "/track" },
    { name: "Founder", path: "/founder" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        isSolid
          ? "bg-white py-4 border-slate-200 shadow-sm"
          : "bg-transparent py-6 border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="group relative z-50">
          <span
            className={`font-black text-xl md:text-2xl tracking-tighter transition-colors ${
              isSolid ? "text-slate-900" : "text-white drop-shadow-md"
            }`}
          >
            CHILL.THRIVE
          </span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-6 xl:gap-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`text-xs font-bold uppercase tracking-widest transition-colors hover:scale-105 ${
                pathname === link.path
                  ? "text-blue-600"
                  : isSolid
                  ? "text-slate-500 hover:text-blue-600"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* CTA BUTTON */}
          <Link
            href="/book"
            className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 ${
              isSolid
                ? "bg-black text-white hover:bg-zinc-800"
                : "bg-white text-black hover:bg-blue-50"
            }`}
          >
            Book Now
          </Link>
        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative z-50 p-2 focus:outline-none"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span
              className={`h-0.5 w-full bg-current transform transition-all duration-300 ${
                isSolid ? "text-black" : "text-white"
              } ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`h-0.5 w-full bg-current transition-all duration-300 ${
                isSolid ? "text-black" : "text-white"
              } ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`h-0.5 w-full bg-current transform transition-all duration-300 ${
                isSolid ? "text-black" : "text-white"
              } ${isMobileMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <div
        className={`fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 transition-all duration-500 ease-in-out md:hidden ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-2xl font-black uppercase tracking-tighter hover:text-blue-600 transition-colors ${
                pathname === link.path ? "text-blue-600" : "text-slate-900"
            }`}
          >
            {link.name}
          </Link>
        ))}
        <Link
          href="/book"
          onClick={() => setIsMobileMenuOpen(false)}
          className="mt-4 px-10 py-4 rounded-full bg-black text-white font-bold text-lg uppercase tracking-wider shadow-xl"
        >
          Book Now
        </Link>
      </div>
    </nav>
  );
}