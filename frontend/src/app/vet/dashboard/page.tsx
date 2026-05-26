// src/app/vet/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/vet/nav1";
import Tabs from "@/components/vet/tabs";
import { api } from "@/utils/api";

/* -------------------- AppointmentCard props -------------------- */
export type AppointmentProps = {
  id: number | string;
  petName?: string;
  date?: string;
  time?: string;
  status?: string;
  visitType?: string;
  petImage?: string | null;
  owner?: string;
  onView?: (id: number | string) => void;
  onReschedule?: (id: number | string) => void;
};

/* -------------------- AppointmentCard -------------------- */
function AppointmentCard({
  id,
  petName,
  date,
  time,
  status,
  visitType,
  petImage,
  owner,
  onView,
  onReschedule,
}: AppointmentProps) {
  const router = useRouter();

const handleViewDetails = () => {
  if (onView) return onView(id);
  router.push(`/vet/appointments/${id}`);  // <-- Correct route
};


  const handleReschedule = () => {
    if (onReschedule) return onReschedule(id);
    router.push(`/vet/appointments/${id}/reschedule`);
  };

  const statusColorClass =
    status?.toLowerCase() === "cancelled"
      ? "text-red-700 bg-red-50"
      : status?.toLowerCase() === "completed"
      ? "text-green-700 bg-green-50"
      : "text-pink-700 bg-pink-50";

  return (
    <article
  className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4
             transition-transform hover:shadow-md hover:-translate-y-1"
  aria-labelledby={`appt-${id}-title`}
>
  {/* Row 1: Image + Appointment Info */}
  <div className="flex items-center gap-4">
    {/* Pet Image */}
    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
      {petImage ? (
        <Image
          src={petImage}
          alt={petName || "Pet image"}
          width={80}
          height={80}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 21v-2a6 6 0 016-6h4a6 6 0 016 6v2"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
          </svg>
        </div>
      )}
    </div>

    {/* Appointment Details */}
    <div className="flex flex-col text-gray-800 gap-1 w-full">
      <h3
        id={`appt-${id}-title`}
        className="text-lg font-bold text-black"
      >
        {petName ?? "Unknown Pet"}
      </h3>
      <p className="text-sm text-gray-700">Owner: {owner ?? "—"}</p>
      <p>
        <span className="font-semibold">Date:</span> {date ?? "—"}{" "}
        <span className="text-gray-500">{time ?? "--:--"}</span>
      </p>
      <p>
        <span className="font-semibold">Visit Type:</span> {visitType ?? "—"}
      </p>
      <p>
        <span className="font-semibold">Status:</span>{" "}
        <span
          className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${statusColorClass}`}
        >
          {status ?? "Unknown"}
        </span>
      </p>
    </div>
  </div>

  {/* Row 2: Buttons */}
  <div className="flex justify-between gap-3 w-full">
    <button
      onClick={handleViewDetails}
      className="flex-1 py-2 rounded-lg text-white font-medium bg-pink-400 hover:bg-pink-500 transition-colors"
    >
      View Details
    </button>
    <button
      onClick={handleReschedule}
      className="flex-1 py-2 rounded-lg text-pink-600 font-medium bg-white border border-pink-300 hover:bg-pink-50 transition-colors"
    >
      Reschedule
    </button>
  </div>
</article>

  );
}

/* -------------------- Dashboard -------------------- */
export default function VetDashboard() {
  const [appointments, setAppointments] = useState<AppointmentProps[]>([]);
  const [rawResponse, setRawResponse] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Appointments");
  const [activeSubTab, setActiveSubTab] = useState("Upcoming");

  // Fetch raw appointments response & today's summary
  const fetchRawAppointments = async () => {
    setLoading(true);

    try {
      const [appointmentsRes, summaryRes] = await Promise.all([
        api.get(`/appointments/myAppointments`),
        api.get(`/appointments/vetTodaySummary`).catch(() => null),
      ]);
      
      setRawResponse(appointmentsRes || {});
      if (summaryRes && summaryRes.success) {
        setSummary(summaryRes.data || null);
      } else if (summaryRes) {
        setSummary(summaryRes || null);
      }
      console.debug("Appointments response:", appointmentsRes);
    } catch (err: any) {
      console.error("Fetch appointments error:", err);
      setRawResponse({});
    } finally {
      setLoading(false);
    }
  };

  // Transform rawResponse + activeSubTab into appointment cards array
  useEffect(() => {
    if (!rawResponse || Object.keys(rawResponse).length === 0) {
      setAppointments([]);
      return;
    }

    let key = activeSubTab.toLowerCase();
    if (key === "ongoing") {
      key = "on-going";
    }

    let sourceArray: any[] = [];

    if (key === "all") {
      sourceArray = [
        ...(rawResponse["upcoming"] || []),
        ...(rawResponse["on-going"] || []),
        ...(rawResponse["completed"] || []),
        ...(rawResponse["no-show"] || []),
      ];
    } else {
      sourceArray = Array.isArray(rawResponse[key]) ? rawResponse[key] : [];
    }

    const transformed: AppointmentProps[] = sourceArray.map((item: any) => ({
      id: item.appointment_id ?? item.id ?? item._id ?? "unknown",
      petName: item.pet?.name || item.pet_name || item.petName || "Unknown",
      date: item.date || item.appointment_date || "",
      time: item.time || item.appointment_time || "",
      status: item.status || "Unknown",
      visitType: item.visit_type || item.visitType || item.type || "—",
      petImage:
        item.pet?.profile_picture || item.pet_image || item.petImage || null,
      owner: item.owner || item.pet?.owner || item.owner_name || "Unknown",
    }));

    setAppointments(transformed);
  }, [rawResponse, activeSubTab]);

  // initial fetch
  useEffect(() => {
    fetchRawAppointments();
  }, []);

  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === "Appointments") {
      // Already filtered from rawResponse[key] in useEffect
      return true;
    }
    if (activeTab === "Emergencies") {
      return appt.visitType?.toLowerCase().includes("emergency");
    }
    if (activeTab === "Home Visits") {
      return appt.visitType?.toLowerCase().includes("home");
    }
    return true;
  });

  const handleTabChange = (mainTab: string, subTab: string) => {
    setActiveTab(mainTab);
    setActiveSubTab(subTab);
  };

  const handleRefresh = () => {
    fetchRawAppointments();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="p-6 max-w-7xl mx-auto">
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-pink-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Appointments Today</p>
              <h4 className="text-3xl font-bold mt-1 text-gray-900">{summary?.total_appointments ?? 0}</h4>
            </div>
            <div className="text-3xl">📅</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-green-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Appointments</p>
              <h4 className="text-3xl font-bold mt-1 text-gray-900">{summary?.completed ?? 0}</h4>
            </div>
            <div className="text-3xl">✅</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-blue-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Today</p>
              <h4 className="text-3xl font-bold mt-1 text-gray-900">{(summary?.upcoming || []).length}</h4>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs onChange={handleTabChange} />
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh appointments"
              className="px-6 py-3 text-lg rounded-xl font-medium shadow-md bg-pink-400 text-white 
                         hover:bg-pink-500 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading appointments...</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt) => (
                <AppointmentCard key={appt.id} {...appt} />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 text-lg">No appointments found.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
