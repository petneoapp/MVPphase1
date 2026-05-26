"use client";

import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import Image from "next/image";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const products = [
  {
    id: 1,
    title: "Drools | 3KG",
    desc: "Adult chicken and egg Egg, Chicken 3 kg Dry Adult Dog Food",
    img: "/images/food.svg",
  },
  {
    id: 2,
    title: "Canine Creek | 4KG",
    desc: "Life preservation formula, Grain free, Adult 4 kg Dry Dog Food",
    img: "/images/food1.svg",
  },
  {
    id: 3,
    title: "Pedigree Biscrok | 500G",
    desc: "Crunchy biscuits with milk & chicken, source of calcium and protein",
    img: "/images/food2.svg",
  },
  {
    id: 4,
    title: "Royal Canin | 2KG",
    desc: "Premium dry food for adult dogs, balanced nutrition",
    img: "/images/food.svg",
  },
    {
    id: 5,
    title: "Canine Creek | 4KG",
    desc: "Life preservation formula, Grain free, Adult 4 kg Dry Dog Food",
    img: "/images/food1.svg",
  },
  {
    id: 6,
    title: "Pedigree Biscrok | 500G",
    desc: "Crunchy biscuits with milk & chicken, source of calcium and protein",
    img: "/images/food2.svg",
  },
  {
    id: 7,
    title: "Royal Canin | 2KG",
    desc: "Premium dry food for adult dogs, balanced nutrition",
    img: "/images/food.svg",
  },
];

export default function DogFoodSection() {
  return (
    <section
      className={`${poppins.className} w-full bg-white py-12 px-6 md:px-16`}
    >
      {/* === Heading === */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dog Nutrients & Food
          </h3>
          <div className="w-14 h-[2px] bg-pink-500 mt-1"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-black mt-4">
            25 % OFF all Products
          </h2>
        </div>
        <button className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition">
          View More →
        </button>
      </div>

      {/* === Horizontal Scroll Cards === */}
      <div className="flex gap-8 overflow-x-auto hide-scrollbar">
        {products.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="min-w-[280px] bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center"
          >
            {/* Image */}
            <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
              <Image
                src={item.img}
                alt={item.title}
                width={180}
                height={200}
                className="object-contain mb-4"
              />
            </motion.div>

            {/* Text */}
            <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {item.desc}
            </p>

            {/* Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="mt-6 px-6 py-2 border border-pink-500 text-pink-500 font-medium rounded-lg hover:bg-pink-500 hover:text-white transition"
            >
              Buy Now
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* === Custom scrollbar hide === */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE & Edge */
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari */
        }
      `}</style>
    </section>
  );
}
