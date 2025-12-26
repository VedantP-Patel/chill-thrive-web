import Link from "next/link";
import ServiceCard from "@/components/ServiceCard"; // We import the component we just made

export default function Home() {
  // DATA STRUCTURE: This simulates fetching data from a database
  const services = [
    {
      title: "Ice Bath", // 
      description: "Cold immersion therapy to reduce inflammation and enhance mental toughness." 
    },
    {
      title: "Jacuzzi", // 
      description: "Warm hydrotherapy for muscle relaxation and nervous system calm."
    },
    {
      title: "Steam Bath", // 
      description: "Detoxifying heat therapy for relaxation and respiratory health."
    },
    {
      title: "Combo Therapy", // 
      description: "Full recovery experience combining Ice, Steam, and Jacuzzi."
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* --- HERO SECTION --- */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center bg-blue-900 text-white text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">Welcome to Chill Thrive</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-blue-100">
          Rejuvenate your body. Reset your mind.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <button className="bg-white text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition">
            Book a Session
          </button>
          <button className="border-2 border-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition">
            Explore Services
          </button>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="py-20 px-4 md:px-20">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Our Premium Services</h2>
        
        {/* GRID LAYOUT: This organizes the cards into columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* THE LOOP: This runs 4 times, creating 4 cards automatically */}
          {services.map((service, index) => (
            <ServiceCard 
              key={index} 
              title={service.title} 
              description={service.description} 
            />
          ))}
        </div>
      </section>
    </main>
  );
}