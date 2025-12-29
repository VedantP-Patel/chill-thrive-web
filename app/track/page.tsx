import StatusTracker from "@/components/StatusTracker";
import Link from "next/link";

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full z-0"></div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">BOOKING STATUS</h1>
            <p className="text-zinc-500">Check the real-time status of your recovery session.</p>
        </div>
        
        {/* The Tracker Engine */}
        <StatusTracker />

        <div className="mt-8 text-center">
            <Link href="/" className="text-zinc-500 hover:text-white text-sm font-bold border-b border-zinc-800 hover:border-white transition-all pb-1">
                ← Return Home
            </Link>
        </div>
      </div>
    </main>
  );
}