"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 1. ADMIN CHECK: Hide completely on admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // 2. CHECK IF WE ARE ON THE HOME PAGE
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 3. DETERMINE STYLE
  // If scrolled OR NOT on homepage -> Dark Background
  // If on homepage and top -> Transparent
  const useDarkNav = isScrolled || !isHomePage;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          useDarkNav
            ? "bg-black/90 backdrop-blur-md border-b border-white/10 py-3 shadow-2xl"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          <Link href="/" className="text-2xl font-bold tracking-tighter text-white relative z-50 group">
            CHILL<span className="text-blue-500 group-hover:text-blue-400 transition-colors">.</span>THRIVE
          </Link>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center gap-8">
            <NavLink href="/" label="Home" active={pathname === "/"} />
            <NavLink href="/#services" label="Services" />
  
            {/* NEW TRACK LINK */}
            <NavLink href="/track" label="Track Status" active={pathname === "/track"} />
  
            <Link
              href="/book"
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Book Now
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white z-50 relative p-2 focus:outline-none"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2.5" : ""}`}></span>
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 transition-all duration-500 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <MobileLink href="/" label="Home" />
        <MobileLink href="/#services" label="Services" />
        <MobileLink href="/track" label="Track Status" /> {/* NEW */}
        <Link href="/book" className="text-2xl font-bold bg-white text-black px-10 py-4 rounded-full mt-4 hover:scale-105 transition-transform">
          Book Now
        </Link>
      </div>
    </>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors relative group ${
        active ? "text-white" : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
      <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full ${active ? "w-full" : ""}`}></span>
    </Link>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-3xl font-light text-white tracking-widest hover:text-blue-400 transition-colors">
      {label}
    </Link>
  );
}