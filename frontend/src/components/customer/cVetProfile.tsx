"use client";

import React from "react";
import { DayStatus, Vet } from "@/app/customer/dashboard/page";
import { PageType } from "@/app/customer/dashboard/constants";
import { BsStarFill } from "react-icons/bs";
import { FaMapMarkerAlt } from "react-icons/fa";
import { LuHandHeart } from "react-icons/lu";
import { PiClockCountdownBold } from "react-icons/pi";

interface C_VetProfileProps {
    selectedVet: Vet | null;
    onPageTypeChange: (pageType: PageType) => void;
}

// Map to short day names
const dayShort: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function transformSchedule(data: DayStatus[]) {
  // Find open days
  const openDays = data.filter((d) => d.status !== "Closed");

  if (openDays.length === 0) {
    return { days: "Closed", hours: "" };
  }

  // Get the first and last open days
  const firstDay = dayShort[openDays[0].day];
  const lastDay = dayShort[openDays[openDays.length - 1].day];

  // Take the working hours from first open day (assuming all same)
  const hours = openDays[0].status;

  return {
    days: `${firstDay} - ${lastDay}`,
    hours,
  };
}


export default function C_VetProfile({ selectedVet, onPageTypeChange }: C_VetProfileProps) {
    const doctor = {
    name: selectedVet?.name,
    experience: selectedVet?.experience,
    rating: selectedVet?.rating,
    ratingsCount: selectedVet?.ratingCount,
    image: selectedVet?.image,
    services: selectedVet?.tags,
    timings: transformSchedule(selectedVet?.weekly_schedule || []),
    address: selectedVet?.clinic?.address,
    map: `https://maps.google.com/maps?q=${selectedVet?.clinic?.latitude},${selectedVet?.clinic?.longitude}&z=14&output=embed`,
    };
    const handleScheduleNowBtnClick = () => {
        onPageTypeChange(PageType.VET_APPOINTMENT_BOOKING);
    };

    return (
        <div className="min-h-screen bg-[#e3e8f9] flex flex-col items-center py-10 px-6">
            <div className="w-full max-w-6xl flex flex-col md:flex-row gap-10">
                {/* Doctor Info */}
                <div className="flex flex-row items-center md:items-start md:w-1/4 space-y-4">
                <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                />
                <div className="text-left pl-5 pt-2">
                    <h2 className="font-semibold text-sm">{doctor.name}</h2>
                    <p className="text-gray-500 text-sm">{doctor.experience}</p>
                    <div className="flex items-center text-xs space-x-1 mt-1 text-yellow-400">
                    <BsStarFill />
                    <span className="font-semibold text-yellow-500">{doctor.rating}</span>
                    <span className="text-gray-400 ml-1">
                        ({doctor.ratingsCount} Ratings)
                    </span>
                    </div>
                </div>
                </div>

                {/* Services and Schedule */}
                <div className="md:w-7/20 flex flex-col space-y-6">
                {/* Services Header */}
                <div className="flex items-center gap-2 mb-3">
                    <LuHandHeart size={30} />
                    <h3 className="font-semibold text-lg">Services</h3>
                </div>
                {/* Services buttons */}
                <div className="flex gap-3 flex-wrap max-w-xl self-center">
                    {doctor.services?.map((service) => (
                    <button
                        key={service.id}
                        className="bg-[#D64AA026] text-[#D64AA0] px-4 py-1 rounded-md text-sm font-medium"
                    >
                        {service.name}
                    </button>
                    ))}
                </div>

                {/* Availability & Address */}
                <div className="max-w-xl border border-gray-300 rounded-[1vw] overflow-hidden mt-6 mb-5">
                    <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-4 bg-white">
                        <PiClockCountdownBold size={30}/>
                    <div>
                        <span className="font-semibold text-gray-900">{doctor.timings.days}</span>
                        <p className="text-gray-500 text-xs">{doctor.timings.hours}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-6 bg-white">
                        <FaMapMarkerAlt size={25} />
                    <span className="text-gray-700 text-sm">{doctor.address}</span>
                    </div>
                </div>

                {/* Clinic Details */}
                <div>
                    <h4 className="font-semibold mb-2">Clinic Details</h4>
                    <div className="rounded-[1vw] overflow-hidden max-w-xl">
                    <iframe
                        title="Clinic Location"
                        src={doctor.map}
                        width="100%"
                        height="160"
                        loading="lazy"
                        className="rounded-[2vw]"
                        style={{ border: 0 }}
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                    </div>
                </div>

                {/* Schedule now button */}
            <button className={`bg-pink-600 text-white rounded-xl py-3 px-8 max-w-xl w-full font-semibold hover:bg-pink-700 transition`}
                onClick={handleScheduleNowBtnClick}>
                    Schedule now
                </button>
                </div>
            </div>
        </div>
    );
}
