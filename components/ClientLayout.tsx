"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Logic: Hide Navbar/Footer if URL starts with /admin
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {/* Only show Navbar if NOT on admin page */}
      {!isAdmin && <Navbar />}
      
      {/* Render the page content */}
      {children}
      
      {/* Only show Footer if NOT on admin page */}
      {!isAdmin && <Footer />}
    </>
  );
}