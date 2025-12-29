"use client";

import { useState, useEffect } from "react";

export default function HeroTypewriter() {
  const [part1, setPart1] = useState(""); // For "Chill."
  const [part2, setPart2] = useState(""); // For "Thrive."
  const [showCursor, setShowCursor] = useState(true);

  // The target text
  const txt1 = "Chill.";
  const txt2 = "Thrive.";

  useEffect(() => {
    let i = 0;
    let j = 0;
    
    // 1. Start typing "Chill."
    const timer1 = setInterval(() => {
      if (i < txt1.length) {
        setPart1((prev) => txt1.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer1);
        
        // 2. Start typing "Thrive." (after Chill is done)
        const timer2 = setInterval(() => {
          if (j < txt2.length) {
            setPart2((prev) => txt2.substring(0, j + 1));
            j++;
          } else {
            clearInterval(timer2);
          }
        }, 150); // Typing Speed (ms)
      }
    }, 150); 

    // 3. Cursor Blinking
    const blinker = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(timer1);
      clearInterval(blinker);
    };
  }, []);

  return (
    <h1 className="text-6xl md:text-9xl font-light mb-8 tracking-tighter leading-none drop-shadow-2xl min-h-[1.2em]">
      {part1}
      <span className="font-bold">{part2}</span>
      <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-blue-400 ml-1 transition-opacity duration-100`}>|</span>
    </h1>
  );
}