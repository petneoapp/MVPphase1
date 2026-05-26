import React from "react";
import { FiSearch, FiCalendar, FiInbox } from "react-icons/fi";

export function EmptyDoctors() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="p-3 bg-pink-50 rounded-full text-pink-500 mb-4">
        <FiSearch className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No nearby vets found</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Try expanding your search radius or selecting a different location to find available veterinary clinics.
      </p>
    </div>
  );
}

export function EmptyAppointments() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="p-3 bg-pink-50 rounded-full text-pink-500 mb-4">
        <FiCalendar className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No appointments to show</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        You don't have any appointments scheduled in this category.
      </p>
    </div>
  );
}

export function EmptyPets() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="p-3 bg-pink-50 rounded-full text-pink-500 mb-4">
        <FiInbox className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No pets to show</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        You haven't added any pets to your profile yet. Add a pet to manage their health records and book appointments.
      </p>
    </div>
  );
}
