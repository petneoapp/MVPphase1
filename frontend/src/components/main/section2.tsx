'use client';

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Poppins, Lato } from "next/font/google";

// Load fonts for this component
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pets = [
  { id: 1, name: "Dog", img: "/images/dog1.svg" },
  { id: 2, name: "Cat", img: "/images/cat1.svg" },
  { id: 3, name: "Parrot", img: "/images/parrot.svg" },
  { id: 4, name: "Hamster", img: "/images/hamster.svg" },
  { id: 5, name: "Dog 2", img: "/images/dog1.svg" },
  { id: 6, name: "Cat 2", img: "/images/cat1.svg" },
];

export default function Section2(): React.JSX.Element {
  const [showAll, setShowAll] = useState(false);
  const visiblePets = showAll ? pets : pets.slice(0, 4);

  return (
    <div className={`${poppins.className} w-full`}>
      {/* ---------------- Hero Section ---------------- */}
     <section className="relative w-full overflow-hidden">
  {/* Background container */}
  <div className="relative w-full h-[50vh] md:h-[70vh]">
    <Image
      src="/images/frame1.svg"
      alt="Background"
      fill
      className="object-cover"
      priority
    />

    {/* Centered layout wrapper (keeps text & dog aligned nicely on desktop) */}
    <div className="absolute inset-0 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 flex flex-col md:flex-row items-center md:items-stretch justify-between">
        {/* Text column */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex items-center">
          <div className="text-white max-w-xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight md:leading-snug">
              Caring Hands for Happy Paws
            </h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg font-light">
              Expert veterinary care to keep your pets healthy and thriving.
            </p>
          </div>
        </div>

        {/* Dog column - right aligned on desktop, centered beneath on mobile */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex justify-center md:justify-end items-end pointer-events-none">
          {/* control the overlap using translate-y; larger screens overlap more */}
          <div className="w-[120px] sm:w-[180px] md:w-[300px] lg:w-[360px] transform translate-y-6 md:translate-y-12 lg:translate-y-16">
            <Image
              src="/images/dog.svg"
              alt="Dog"
              width={600}
              height={600}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>

    {/* Readability overlay (soft) */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
  </div>

  {/* White spacer so the dog can 'pop' into the following section */}
  <div className="w-full h-[16vh] sm:h-[18vh] md:h-[20vh] bg-white" />
</section>


      {/* ---------------- Pets Section ---------------- */}
      <section className="w-full py-6 bg-white flex flex-col justify-center items-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-pink-400 text-center mb-8 sm:mb-10">
          Who are you treating today?
        </h2>

        {/* Pets Grid - 1 column on very small, 2 columns on small, 3 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 sm:px-6">
          {visiblePets.map((pet, index) => (
            <div
              key={pet.id}
              className={`relative flex flex-col justify-center items-center bg-pink-50 rounded-2xl px-4 py-6 w-full min-h-[180px] sm:min-h-[200px] shadow-sm`}
            >
              <div className="w-[90px] sm:w-[120px] md:w-[140px]">
                <Image
                  src={pet.img}
                  alt={pet.name}
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>

              <div className="mt-4 text-sm sm:text-base font-semibold text-gray-800">
                {pet.name}
              </div>

              <button
                aria-label={`View ${pet.name}`}
                className="absolute top-4 right-4 bg-white text-pink-500 font-semibold px-3 py-1 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-pink-200"
                onClick={() => {
                  /* replace with your navigation or modal logic */
                }}
              >
                View
              </button>
            </div>
          ))}
        </div>

        {/* See More / See Less */}
        {pets.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-6 text-pink-500 font-semibold text-sm sm:text-base focus:outline-none focus:underline"
            aria-expanded={showAll}
          >
            {showAll ? "View Less" : "View All Pets"}
          </button>
        )}
      </section>

      {/* ---------------- Scrolling Marquee / Promo ---------------- */}
      <section className="relative w-full bg-blue-800 overflow-hidden py-3">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-100%"] }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
        >
          {/* duplicated content for a seamless loop */}
          <div className="flex space-x-8 text-white font-medium text-sm sm:text-base px-6">
            <span className="inline-block">Get 30% OFF on First Order</span>
            <span className="inline-block text-lg">✚</span>
            <span className="inline-block">Free Shipping over ₹499</span>
            <span className="inline-block text-lg">✚</span>
            <span className="inline-block">24/7 Vet Consult</span>
            <span className="inline-block text-lg">✚</span>
          </div>

          <div className="flex space-x-8 text-white font-medium text-sm sm:text-base px-6">
            <span className="inline-block">Get 30% OFF on First Order</span>
            <span className="inline-block text-lg">✚</span>
            <span className="inline-block">Free Shipping over ₹499</span>
            <span className="inline-block text-lg">✚</span>
            <span className="inline-block">24/7 Vet Consult</span>
            <span className="inline-block text-lg">✚</span>
          </div>
        </motion.div>
      </section>

      {/* ---------------- Paw / Feature Section ---------------- */}
      <section className="relative w-full bg-white flex flex-col items-center py-10 md:py-16">
        <h2 className={`${lato.className} text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 text-center`}>
          YOUR PET WELL BEING
        </h2>
        <p className="text-gray-600 text-center mt-2 mb-8 px-6 max-w-2xl">
          A companion for your pet’s happiness
        </p>

        <div className="relative w-full max-w-6xl flex flex-col md:flex-row items-center justify-center px-4 md:px-8">
          {/* Left Text */}
          <div className="md:w-1/4 w-full text-center md:text-left px-4 mb-8 md:mb-0">
            <p className="text-sm md:text-base text-gray-800 leading-relaxed">
              <span className="font-semibold">Premium Care:</span>
              <br />
              Pamper your pet with high-quality food, toys, and accessories for a
              healthier, happier life.
            </p>
          </div>

          {/* Center Paw Image */}
          <div className="md:w-2/4 w-full flex justify-center items-center">
            <div className="w-[180px] sm:w-[260px] md:w-[420px]">
              <Image
                src="/images/paw.svg"
                alt="Paw Shape"
                width={800}
                height={800}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Right Text */}
          <div className="md:w-1/4 w-full text-center md:text-right px-4 mt-8 md:mt-0">
            <p className="text-sm md:text-base text-gray-800 leading-relaxed">
              The first order is free:
              <br />
              Try our top-rated products at no cost.
            </p>
          </div>
        </div>

        {/* Bottom Images Row */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 md:px-8 w-full max-w-4xl">
          <div className="w-full h-[90px] sm:h-[110px] md:h-[130px] overflow-hidden rounded-2xl">
            <Image src="/images/cats1.svg" alt="Cat" width={400} height={400} className="object-cover w-full h-full" />
          </div>
          <div className="w-full h-[90px] sm:h-[110px] md:h-[130px] overflow-hidden rounded-2xl">
            <Image src="/images/cats2.svg" alt="Dog" width={400} height={400} className="object-cover w-full h-full" />
          </div>
          <div className="w-full h-[90px] sm:h-[110px] md:h-[130px] overflow-hidden rounded-2xl">
            <Image src="/images/cats3.svg" alt="Cat" width={400} height={400} className="object-cover w-full h-full" />
          </div>
          <div className="w-full h-[90px] sm:h-[110px] md:h-[130px] overflow-hidden rounded-2xl">
            <Image src="/images/cats4.svg" alt="Dog" width={400} height={400} className="object-cover w-full h-full" />
          </div>
        </div>

        {/* CTA */}
        <button className="mt-8 md:mt-12 bg-pink-500 text-white px-6 sm:px-8 py-2.5 rounded-full shadow hover:bg-pink-600 transition focus:outline-none focus:ring-2 focus:ring-pink-200">
          EXPLORE MORE
        </button>
      </section>
    </div>
  );
}
