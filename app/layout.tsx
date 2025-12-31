import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout"; // Import the wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chill Thrive | Recovery & Wellness",
  description: "Advanced recovery protocols for high performers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Pass children to ClientLayout. It handles the Navbar/Footer visibility. */}
        <ClientLayout>
            {children}
        </ClientLayout>
      </body>
    </html>
  );
}