"use client";

import React from "react";
import PartnerAppointmentCard from "@/components/partner/PartnerAppointmentCard";
import { PartnerDetails } from "@/types/partner";


interface PartnerUpcomingAppointmentsProps {
  upcomingAppointments: PartnerDetails["upcoming"];
  onSeeAll: () => void;
}

export default function PartnerUpcomingAppointments({
  upcomingAppointments,
  onSeeAll,
}: PartnerUpcomingAppointmentsProps) {
  const hasAppointments = upcomingAppointments && upcomingAppointments.length > 0;

  return (
    <div className="bg-blue-50 rounded-xl p-6 md:p-8 flex flex-col shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
        {hasAppointments && (
          <button
            onClick={onSeeAll}
            className="text-pink-600 hover:text-pink-700 text-sm font-semibold transition-colors"
          >
            See All &gt;
          </button>
        )}
      </div>

      {!hasAppointments ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <img src="/images/customer/paws.png" alt="Empty" className="w-16 h-16 opacity-20 mb-4" />
          <span className="text-lg font-light">No upcoming appointments today</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAppointments.map((appointment) => (
            <PartnerAppointmentCard
              key={appointment.appointment_id}
              appointment={appointment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
