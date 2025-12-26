import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/lib/supabaseClient";

// 1. Make the page ASYNC so it can wait for data
export default async function Home() {
  
  // 2. FETCH DATA FROM SUPABASE
  // We ask for 'title' and 'description' to match our ServiceCard component
  const { data: services, error } = await supabase
    .from("services")
    .select("title, description")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
  }

  return (
    <main className="min-h-screen bg-white">
      {/* --- HERO SECTION --- */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center bg-blue-900 text-white text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">Welcome to Chill Thrive</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-blue-100">
          Rejuvenate your body. Reset your mind.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Link href="/book" className="bg-white text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition">
            Book a Session
          </Link>
          <Link href="#services" className="border-2 border-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition">
            Explore Services
          </Link>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-20 px-4 md:px-20">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Our Premium Services</h2>
        
        {/* DYNAMIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* If services exist, map through them.
             If database fails, show a fallback message. 
          */}
          {services && services.length > 0 ? (
            services.map((service, index) => (
              <ServiceCard 
                key={index} 
                title={service.title} 
                description={service.description} 
              />
            ))
          ) : (
            <p className="text-center col-span-4 text-gray-500">Loading services from database...</p>
          )}
        </div>
      </section>
    </main>
  );
}