// src/app/vet/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { OperationsShell } from "@/components/layout/OperationsShell";
import { MetricCard } from "@/components/common/MetricCard";
import { WorkflowCard } from "@/components/common/WorkflowCard";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

export default function VetDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRawAppointments = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, summaryRes] = await Promise.all([
        api.get(`/appointments/myAppointments`),
        api.get(`/appointments/vetTodaySummary`).catch(() => null),
      ]);
      
      const rawResponse = appointmentsRes || {};
      if (summaryRes && summaryRes.success) {
        setSummary(summaryRes.data || null);
      } else if (summaryRes) {
        setSummary(summaryRes || null);
      }
      
      const sourceArray = [
        ...(rawResponse["upcoming"] || []),
        ...(rawResponse["on-going"] || []),
        ...(rawResponse["completed"] || []),
        ...(rawResponse["no-show"] || []),
      ];

      const transformed = sourceArray.map((item: any) => ({
        id: item.appointment_id ?? item.id ?? item._id ?? "unknown",
        petName: item.pet?.name || item.pet_name || item.petName || "Unknown Pet",
        date: item.date || item.appointment_date || "",
        time: item.time || item.appointment_time || "",
        status: item.status || "pending",
        visitType: item.visit_type || item.visitType || item.type || "—",
        owner: item.owner || item.pet?.owner || item.owner_name || "Unknown",
      }));

      setAppointments(transformed);
    } catch (err: any) {
      console.error("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRawAppointments();
  }, []);

  const handleRefresh = () => fetchRawAppointments();

  const handleViewDetails = (id: string | number) => {
    router.push(`/vet/appointments/${id}`);
  };

  return (
    <OperationsShell
      title="Clinic Operations"
      tabs={[
        { label: "All Appointments", href: "#", active: true },
        { label: "Emergencies", href: "#" },
        { label: "Home Visits", href: "#" },
      ]}
      actions={
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-lg)]">
        <MetricCard 
          title="Total Appointments Today" 
          value={summary?.total_appointments ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          }
        />
        <MetricCard 
          title="Completed" 
          value={summary?.completed ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          }
          trend="up"
        />
        <MetricCard 
          title="Upcoming Today" 
          value={(summary?.upcoming || []).length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          }
          trend="neutral"
        />
      </div>

      {/* Content */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        {loading ? (
          <LoadingState message="Loading appointments..." />
        ) : appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-lg)]">
            {appointments.map((appt) => {
              const normalizedStatus = appt.status.toLowerCase() === 'no-show' ? 'danger' 
                  : appt.status.toLowerCase() === 'completed' ? 'success'
                  : 'info';
                  
              return (
                <WorkflowCard 
                  key={appt.id}
                  title={appt.petName}
                  subtitle={`${appt.visitType} • ${appt.time}`}
                  status={normalizedStatus}
                  assignedTo={appt.owner}
                  onAction={() => handleViewDetails(appt.id)}
                  actionLabel="View Details"
                />
              );
            })}
          </div>
        ) : (
          <EmptyState 
            title="No appointments found" 
            description="You have no appointments scheduled for this view." 
          />
        )}
      </div>
    </OperationsShell>
  );
}

