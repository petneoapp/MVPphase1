"use client";

import React from "react";
import DoctorCard from "@/components/customer/doctorCard";
import { AppointmentDetails } from "@/components/customer/appointmentStatus";
import { SkeletonGrid } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";

interface RecentAppointmentsProps {
  appointments: AppointmentDetails[];
  onViewAll: () => void;
  loading?: boolean;
}

export default function RecentAppointments({
  appointments,
  onViewAll,
  loading,
}: RecentAppointmentsProps) {
  return (
    <section className="space-y-4 w-full">
      <h3 className="font-semibold text-gray-700">My Appointments</h3>
      <div className="rounded-lg shadow border border-gray-300 bg-white p-4">
        {loading ? (
          <SkeletonGrid count={3} />
        ) : appointments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((app) => (
                <DoctorCard key={app.id} appointmentDetails={app} />
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button
                type="button"
                className="w-full sm:w-[370px] bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg px-8 py-2 transition shadow-md"
                onClick={onViewAll}
              >
                View all
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No appointments yet"
            description="You haven't booked any appointments yet. Your recent bookings will appear here."
            actionLabel="Book a Vet"
            onAction={() => window.location.href = "/customer/dashboard?view=vet"}
          />
        )}
      </div>
    </section>
  );
}
