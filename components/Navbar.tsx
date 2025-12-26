import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* BRANDING [Source: 1] */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-900 tracking-tighter">
              Chill Thrive
            </Link>
          </div>

          {/* NAVIGATION LINKS [Source: 19] */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Services
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition">
              About
            </Link>
          </div>

          {/* CTA BUTTON [Source: 29] */}
          <div>
            <Link href="/book" className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
              Book Now
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}