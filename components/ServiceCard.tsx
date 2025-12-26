// This is a reusable component (like a standard circuit module)
interface ServiceProps {
  title: string;
  description: string;
}

export default function ServiceCard({ title, description }: ServiceProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition bg-white text-black">
      <div className="h-40 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500">
        [Image: {title}]
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button className="text-blue-600 font-semibold hover:underline">
        View Details &rarr;
      </button>
    </div>
  );
}