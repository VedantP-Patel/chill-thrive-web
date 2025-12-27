"use client";

import { useState, useEffect } from "react";

export default function TypewriterTitle() {
  const fullText = "Chill Thrive";
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + fullText.charAt(index));
        setIndex((prev) => prev + 1);
      }, 150); // Adjust speed here (lower = faster)
      
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-2 h-[80px] md:h-[90px]">
      {text}
      {/* The Blinking Cursor */}
      <span className="animate-pulse text-blue-400 font-thin ml-1">|</span>
    </h1>
  );
}