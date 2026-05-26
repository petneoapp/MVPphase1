"use client";

import React from "react";
import { Service } from "@/components/customer/cDashboard";

interface QuickServicesProps {
  services: Service[];
  onServiceClick: (service: Service) => void;
}

export default function QuickServices({
  services,
  onServiceClick,
}: QuickServicesProps) {
  return (
    <section className="bg-[#d6dafc] rounded-lg p-6 shadow border border-gray-300 flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-md w-full mx-auto md:mx-0">
        <h2 className="col-span-2 sm:col-span-3 font-semibold mb-2 text-gray-800 text-center sm:text-left">
          Quick Services for Your Pet
        </h2>
        {services.map((service) => (
          <div key={service.id} className="flex flex-col items-center">
            <div
              className="w-full max-w-[120px] sm:max-w-[144px] aspect-square bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center"
              onClick={() => onServiceClick(service)}
            >
              <img
                src={service.icon}
                alt={service.label}
                className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
              />
            </div>
            <span className="text-black text-xs sm:text-sm font-semibold pt-3 sm:pt-4 text-center">
              {service.label}
            </span>
          </div>
        ))}
      </div>


      <div className="flex-1 flex justify-end mr-10">
        <img
          src="/images/customer/cuteDog.png"
          alt="Cute Dog"
          className="w-70 h-70 object-contain select-none pointer-events-none"
        />
      </div>
    </section>
  );
}
