import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // IMPORT THE MODULE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chill Thrive | Recovery & Wellness",
  description: "Premium ice bath and recovery therapy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* THE NAVBAR IS WIRED HERE */}
        <Navbar /> 
        
        {/* THIS IS WHERE THE PAGE CONTENT (Hero, Services) LOADS */}
        <main className="pt-16"> 
          {children}
        </main>
      </body>
    </html>
  );
}