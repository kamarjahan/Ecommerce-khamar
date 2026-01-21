import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { name: "Mobiles", image: "/cat-mobile.png", slug: "mobiles" },
  { name: "Fashion", image: "/cat-fashion.png", slug: "fashion" },
  { name: "Electronics", image: "/cat-elec.png", slug: "electronics" },
  { name: "Home", image: "/cat-home.png", slug: "home" },
  { name: "Beauty", image: "/cat-beauty.png", slug: "beauty" },
];

export default function CategorySection() {
  return (
    <section className="bg-white py-6 border-b">
      <div className="container px-4">
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.slug} 
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center min-w-[80px] group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-blue-600 transition-all">
                {/* Replace with actual category images or icons */}
                <div className="text-xs text-gray-400">IMG</div> 
              </div>
              <span className="mt-2 text-xs md:text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}