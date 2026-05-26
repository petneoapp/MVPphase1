"use client";

import React from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { Pet, User } from "@/app/customer/dashboard/page";
import { Skeleton } from "@/components/common/SkeletonLoader";

interface DashboardGreetingProps {
  user: User | null;
  pets: Pet[];
  onPetClick: (petId: number) => void;
  onAddPet: () => void;
  loading?: boolean;
}

export default function DashboardGreeting({
  user,
  pets,
  onPetClick,
  onAddPet,
  loading,
}: DashboardGreetingProps) {
  return (
    <section className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img src="/images/customer/paws.png" alt="paws" />
        <div>
          {loading ? (
             <>
                <Skeleton className="w-32 h-6 mb-1" />
                <Skeleton className="w-48 h-4" />
             </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Hello, {user?.name || "there"}</h2>
              <p className="text-gray-500 text-sm">Let's get started from where we left.</p>
            </>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-pink-600 font-semibold mb-2 select-none">My Pets</h3>
        <div className="flex items-center space-x-4">
          {loading ? (
             <div className="flex space-x-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="w-16 h-16 rounded-full" />
             </div>
          ) : (
            <>
              {pets.map((item) => (
                <div key={item.id} className="flex-col items-center">
                  <button
                    onClick={() => onPetClick(item.id)}
                    className="w-16 h-16 rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400"
                    aria-label={item.name}
                    type="button"
                  >
                    <img
                      src={item.profile_url || "/images/customer/paws.png"}
                      alt={item.name}
                      className="object-cover w-full h-full"
                      draggable={false}
                    />
                  </button>
                  <div className="text-center text-xs mt-1">{item.name}</div>
                </div>
              ))}
    
              <div className="pb-7">
                <FaCirclePlus
                  color="#D64AA0"
                  className="w-16 h-16 cursor-pointer hover:scale-110 transition-transform"
                  onClick={onAddPet}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:block self-start">
        <img
          src="/images/customer/calender.png"
          alt="Pet management illustration"
          className="w-28 h-auto select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </section>
  );
}
