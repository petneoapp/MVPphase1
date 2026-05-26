"use client";

import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// === Testimonials Data ===
const testimonials = [
  {
    id: 1,
    name: "Anna & Tobby",
    feedback: "Amazing Products & Delivery on time.",
    rating: 4.2,
    img: "/images/customer1.svg",
  },
  {
    id: 2,
    name: "Christine & Tom",
    feedback: "Love the overall Shopping experience!",
    rating: 4.5,
    img: "/images/customer2.svg",
  },
  {
    id: 3,
    name: "Sindy & Kitch",
    feedback: "Kitch loves food from the pup-hub.",
    rating: 4.8,
    img: "/images/customer3.svg",
  },
];

// === Utility for stars ===
const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={i}
        size={16}
        className="fill-yellow-400 text-yellow-400"
      />
    );
  }

  return stars;
};

export default function AffiliateAndTestimonials() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter a valid email.");
      return;
    }
    //  API call or integration here
    alert(`Thank you for joining! We'll contact you at ${email}`);
    setEmail("");
  };

  return (
    <section className={`${poppins.className} w-full`}>
      

      {/* === Testimonials Section === */}
      <div className="bg-pink-100 py-15 px-6 md:px-16">
        {/* Heading */}
        <div className="text-left mb-12">
          <h3 className="text-xl font-semibold text-gray-900">
            Happy Customers
          </h3>
          <div className="w-20 h-[3px] bg-pink-500 mt-2 rounded"></div>
        </div>

        {/* Cards */}
        <div className="flex flex-wrap justify-center gap-10">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="w-[300px] bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="w-full h-[360px] relative">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Text Box */}
              <div className="px-6 py-5">
                <h4 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {item.feedback}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1">{renderStars(item.rating)}</div>
                  <span className="text-sm font-medium text-gray-800">
                    {item.rating.toFixed(1)}/5
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* === White Section (Explore More Button) === */}
      <div className="bg-white flex justify-center py-12">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="bg-pink-500 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-pink-600 transition"
        >
          Explore More
        </motion.button>
      </div>

      {/* === Affiliate Section === */}
      <div className="bg-pink-100 py-16 px-6 md:px-16 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10"
        >
          Join us with Affiliate program
        </motion.h2>

        {/* Form Box */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between max-w-2xl mx-auto overflow-hidden"
        >
          {/* Input */}
          <input
            type="email"
            placeholder="Type your email address here"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 text-gray-700 outline-none placeholder-gray-500 text-sm sm:text-base"
            required
          />

          {/* Button */}
          <button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 transition text-white px-6 py-3 font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            Submit now
          </button>
        </motion.form>
      </div>
    </section>
  );
}
