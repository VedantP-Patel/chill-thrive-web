"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Supabase Client (Browser Side)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("❌ " + error.message);
      setLoading(false);
    } else {
      // Refresh to update middleware cookie check
      router.refresh(); 
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="mb-8 text-center">
          <h1 className="font-black text-2xl uppercase tracking-tighter">System Access</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Admin Protocol</p>
        </div>

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Admin Email" 
            className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Passcode" 
            className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            disabled={loading}
            className="w-full py-4 bg-black text-white font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Enter Console"}
          </button>
        </div>
      </form>
    </div>
  );
}