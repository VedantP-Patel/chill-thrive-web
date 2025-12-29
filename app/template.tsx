"use client";

import { motion } from "framer-motion";

// If you don't have framer-motion installed, run: npm install framer-motion
// If you prefer NO library, use the CSS version below.

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}