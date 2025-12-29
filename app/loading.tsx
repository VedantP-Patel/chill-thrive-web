export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white">
      
      {/* --- THE ICE BATH ANIMATION --- */}
      <div className="relative w-24 h-16">
        
        {/* 1. Ice Cubes Dropping (Animated) */}
        <div className="absolute top-[-20px] left-4 w-3 h-3 bg-white/90 rounded-sm animate-ice-drop delay-100 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"></div>
        <div className="absolute top-[-30px] left-10 w-4 h-4 bg-cyan-100 rounded-sm animate-ice-drop delay-300 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-20"></div>
        <div className="absolute top-[-15px] right-4 w-3 h-3 bg-white/80 rounded-sm animate-ice-drop delay-500 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"></div>

        {/* 2. The Tub Structure (Static) */}
        <div className="absolute inset-0 border-b-4 border-l-4 border-r-4 border-zinc-500 rounded-b-3xl overflow-hidden bg-zinc-900/50 backdrop-blur-sm z-10">
          
          {/* 3. Water Filling (Animated) */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80 animate-fill-tub"></div>
          
          {/* 4. Surface Ripple (Animated) */}
          <div className="absolute bottom-0 left-0 w-[200%] h-full bg-gradient-to-t from-transparent to-white/20 animate-shimmer opacity-30"></div>
        </div>

        {/* Tub Legs (Decoration) */}
        <div className="absolute -bottom-2 left-2 w-1.5 h-2 bg-zinc-600 rounded-b-md"></div>
        <div className="absolute -bottom-2 right-2 w-1.5 h-2 bg-zinc-600 rounded-b-md"></div>
      </div>

      {/* --- TEXT LABEL --- */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold tracking-[0.4em] text-cyan-500 animate-pulse">
          PREPARING PLUNGE
        </p>
        <div className="flex gap-1">
          <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce delay-75"></span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce delay-150"></span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce delay-300"></span>
        </div>
      </div>

    </div>
  );
}