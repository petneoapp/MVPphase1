"use client";

import React from "react";
import { AppointmentDetails, AppointmentStatusType } from "./appointmentStatus";

interface DoctorCardProps {
  appointmentDetails: AppointmentDetails;
  onViewDetailsClick?: () => void;
}

const DoctorCard = React.memo(function DoctorCard({ appointmentDetails, onViewDetailsClick }: DoctorCardProps) {
  const visitLabel =
    appointmentDetails.visit_purpose === "General Visit"
      ? <span className="bg-green-100 text-green-700 rounded px-2 py-0.5 text-xs font-medium ml-2">General Visit</span>
      : appointmentDetails.visit_purpose === "Emergency"
      ? <span className="bg-red-100 text-red-700 rounded px-2 py-0.5 text-xs font-medium ml-2">Emergency Visit</span>
      : null;

  const isInactive = appointmentDetails.status === 'completed' || appointmentDetails.status === 'cancelled';
  const cardClasses = `bg-white rounded-2xl shadow flex flex-col items-center p-4 min-w-[340px] max-w-md border border-gray-200 text-sm transition-all ${isInactive ? 'opacity-60 grayscale' : ''}`;

  return (
    <div className={cardClasses}>
        <div className="flex flex-row w-full">
            <img src={appointmentDetails.vetProfileUrl} alt={appointmentDetails.vetName} className="h-20 w-20 rounded-full object-cover mr-4 border"/>
            <div className="flex-1 flex flex-col">
                <div className="font-semibold">{appointmentDetails.vetName ? "Dr. " + appointmentDetails.vetName : ""}</div>
                <div className="text-gray-500 text-xs">{appointmentDetails.vetSpecialization}</div>
                {appointmentDetails.clinicName && (
                  <div className="text-gray-600 text-xs font-medium mt-1">
                    {appointmentDetails.clinicName}
                  </div>
                )}
            </div>
            <div className="mt-2 self-start text-right">
                <div className="bg-green-100 text-green-700 rounded px-2 py-1 font-medium text-xs inline-block mb-2">
                    {appointmentDetails.visit_purpose}
                </div>
                {(appointmentDetails.date || appointmentDetails.time) && (
                    <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-1 flex flex-col items-end">
                        {appointmentDetails.date && <div className="text-xs font-bold">{appointmentDetails.date}</div>}
                        {appointmentDetails.time && <div className="text-xs font-semibold">{appointmentDetails.time}</div>}
                    </div>
                )}
            </div>
        </div>
        {onViewDetailsClick && 
            <button className="block mx-auto mt-4 bg-pink-400 hover:bg-pink-500 text-white rounded-lg px-8 py-2 font-medium text-sm transition cursor-pointer"
            onClick={onViewDetailsClick}>
                View Details
            </button>
        }
  </div>
  );
});

export default DoctorCard;
