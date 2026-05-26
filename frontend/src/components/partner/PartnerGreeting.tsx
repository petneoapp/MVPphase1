"use client";

import React from "react";
import ProgressBar from "@/components/common/ProgressBar";
import { PartnerDetails } from "@/types/partner";


interface PartnerGreetingProps {
  partnerDetails: PartnerDetails;
  onSeeAll: () => void;
}

export default function PartnerGreeting({
  partnerDetails,
  onSeeAll,
}: PartnerGreetingProps) {
  const completionPercentage = partnerDetails?.total_appointments
    ? Math.round((partnerDetails.completed || 0) / partnerDetails.total_appointments * 100)
    : 0;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center space-x-4">
        <img src="/images/customer/paws.png" alt="paws" className="w-12 h-12" />
        <div>
          <h2 className="text-lg font-semibold">Hello, Dr. {partnerDetails?.vet_name || "Partner"}</h2>
          <p className="text-gray-500 text-sm">Let's get started from where we left.</p>
        </div>
      </div>
      
      <div className="flex flex-col w-full md:w-[40%]">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-pink-600 font-semibold select-none">My Appointments</h3>
            <span className="text-sm font-medium text-gray-600">
              {partnerDetails?.completed || 0}/{partnerDetails?.total_appointments || 0} Completed
            </span>
          </div>
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-gray-500 text-xs font-medium hover:text-pink-600 transition-colors group"
          >
            <span>See All</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {partnerDetails?.total_appointments && partnerDetails.total_appointments > 0 ? (
          <ProgressBar percentage={completionPercentage} />
        ) : null}
      </div>

      <div className="hidden lg:block self-start">
        <img
          src="/images/customer/calender.png"
          alt="Schedule"
          className="w-24 h-auto opacity-80"
        />
      </div>
    </section>
  );
}
