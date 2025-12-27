import Link from "next/link";
import Image from "next/image";
import TypewriterTitle from "@/components/TypewriterTitle";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  
  // 1. FETCH DATA (Now asking for 'previous_price')
  const { data: services, error } = await supabase
    .from("services")
    .select("title, description, price, previous_price, image_url, booking_image_url") // <--- ADDED previous_price
    .eq("is_active", true)
    .order("id", { ascending: true });

  const fallbackImages = [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop", 
  ];

  return (
    <main className="min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-[90vh] md:h-[85vh] flex flex-col items-center justify-center text-center px-4 text-white overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-full block md:hidden z-0">
             <Image src="/hero-mobile.png" alt="Vertical Spa" fill className="object-cover select-none" priority quality={100} unoptimized />
        </div>
         <div className="absolute top-0 left-0 w-full h-full hidden md:block z-0">
            <Image src="/hero-desktop.png" alt="Horizontal Spa" fill className="object-cover select-none" priority quality={100} unoptimized />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-blue-900/50 to-black mix-blend-multiply z-10"></div>

        <div className="relative z-20 max-w-4xl space-y-6 mt-20">
          <TypewriterTitle />
          <p className="text-xl md:text-2xl text-blue-100/90 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Master your recovery. Elevate your performance.
          </p>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center mt-8">
            <Link href="/book" className="bg-white text-slate-900 px-8 py-3 md:px-10 md:py-4 rounded-xl font-medium hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 w-full md:w-auto">
              Book Session
            </Link>
            <Link href="#services" className="px-8 py-3 md:px-10 md:py-4 rounded-xl font-medium text-white border border-white/30 hover:bg-white/10 transition-all duration-300 backdrop-blur-md w-full md:w-auto">
              Explore Menu
            </Link>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-24 px-4 md:px-20"
        style={{ background: "linear-gradient(to bottom, #000000 0%, #000000 20%, #1e3a8a 50%, #7dd3fc 85%, #ffffff 100%)" }}>
        
        <div className="text-center mb-24">
          <h2 className="text-3xl font-light text-white tracking-wide uppercase drop-shadow-md">Recovery Menu</h2>
          <div className="w-24 h-0.5 bg-white mx-auto mt-4 rounded-full opacity-40 shadow-[0_0_10px_white]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto space-y-24 md:space-y-32">
          {services && services.length > 0 ? (
            services.map((service: any, index: number) => {
              const isEven = index % 2 === 0;
              const finalImage = service.image_url 
                ? service.image_url 
                : (service.booking_image_url ? service.booking_image_url : fallbackImages[index % fallbackImages.length]);

              const isDeepZone = index < 2; 

              return (
                <div key={index} className={`flex flex-col md:flex-row items-center gap-12 md:gap-20 ${isEven ? "" : "md:flex-row-reverse"}`}>
                  
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className={`inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full mb-2 border ${isDeepZone ? "bg-gray-900/80 text-blue-200 border-gray-700" : "bg-blue-100 text-blue-900 border-blue-200"}`}>
                      0{index + 1}
                    </div>
                    <h3 className={`text-3xl md:text-4xl font-light ${isDeepZone ? "text-white" : "text-slate-900"}`}>{service.title}</h3>
                    <p className={`text-lg leading-relaxed font-medium ${isDeepZone ? "text-gray-400" : "text-slate-600"}`}>{service.description}</p>
                    
                    {/* --- PRICE / BOOK BUTTON SECTION --- */}
                    <div className="pt-4">
                      <Link href="/book" className={`font-bold border-b-2 pb-1 transition-all flex items-center gap-3 w-fit mx-auto md:mx-0 ${isDeepZone ? "text-blue-300 border-blue-500/30 hover:text-white hover:border-white" : "text-blue-900 border-blue-900/30 hover:border-blue-900"}`}>
                        
                        <span>Book for</span>
                        
                        <div className="flex items-center gap-2">
                          {/* SHOW PREVIOUS PRICE (Strikethrough) IF IT EXISTS */}
                          {service.previous_price && (
                            <span className="text-sm line-through opacity-60">₹{service.previous_price}</span>
                          )}
                          
                          {/* CURRENT PRICE */}
                          <span className="text-lg">₹{service.price}</span>
                        </div>
                        
                        <span>&rarr;</span>
                      </Link>
                    </div>

                  </div>

                  <div className={`flex-1 w-full h-[400px] relative group overflow-hidden rounded-2xl shadow-2xl border-4 ${isDeepZone ? "border-gray-800" : "border-white"}`}>
                     <Image src={finalImage} alt={service.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className={`absolute inset-0 group-hover:bg-transparent transition-all duration-500 ${isDeepZone ? "bg-black/40" : "bg-blue-900/5"}`}></div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-500 font-medium">No active services available.</div>
          )}
        </div>
      </section>
    </main>
  );
}