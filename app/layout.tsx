import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; 

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
        <Navbar /> 
        
        {/* FIX: Removed 'pt-16'. Now the content slides UNDER the navbar. */}
        <main className=""> 
          {children}
        </main>
      </body>
    </html>
  );
}