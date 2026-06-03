"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { usePartnerDashboardData } from "@/hooks/usePartnerDashboardData";
import { OperationsShell } from "@/components/layout/OperationsShell";
import { WorkflowCard } from "@/components/common/WorkflowCard";
import { AlertBanner } from "@/components/common/AlertBanner";
import { MetricCard } from "@/components/common/MetricCard";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

function PartnerDashboardContent() {
    const router = useRouter();
    const { 
        partnerDetails, 
        loading, 
        errors, 
        dismissError 
    } = usePartnerDashboardData();

    const handleSeeAll = () => {
        router.push("/partner/myAppointments");
    };

    if (loading) {
        return <LoadingState fullScreen message="Loading partner dashboard..." />;
    }

    return (
        <OperationsShell
            title="Partner Operations"
            tabs={[
                { label: "Overview", href: "#", active: true },
                { label: "Grooming & Boarding", href: "/partner/workStatus" },
            ]}
            actions={
                <button
                    onClick={handleSeeAll}
                    className="px-4 py-2 bg-[var(--color-info)] text-white rounded-md shadow-sm text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    View All Appointments
                </button>
            }
        >
            {/* Errors */}
            {errors.map(e => (
                <div key={e.id} className="mb-[var(--spacing-md)]">
                    <AlertBanner
                        type="danger"
                        title={e.title}
                        message={e.message}
                        onDismiss={() => dismissError(e.id)}
                    />
                </div>
            ))}

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-lg)]">
                <MetricCard 
                    title="Total Appointments Today" 
                    value={partnerDetails?.total_appointments ?? 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    }
                />
                <MetricCard 
                    title="Completed" 
                    value={partnerDetails?.completed ?? 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    }
                    trend="up"
                />
                <MetricCard 
                    title="Upcoming Today" 
                    value={(partnerDetails?.upcoming || []).length}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    }
                    trend="neutral"
                />
            </div>

            {/* Upcoming Appointments */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-[var(--spacing-lg)]">
                    <h2 className="text-xl font-heading font-bold text-gray-800 dark:text-gray-100">Upcoming Appointments</h2>
                </div>
                
                {partnerDetails?.upcoming && partnerDetails.upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-lg)]">
                        {partnerDetails.upcoming.map((appt: any) => {
                            const normalizedStatus = appt.status?.toLowerCase() === 'no-show' ? 'danger' 
                                : appt.status?.toLowerCase() === 'completed' ? 'success'
                                : 'info';
                            
                            return (
                                <WorkflowCard 
                                    key={appt.appointment_id || appt.id}
                                    title={appt.pet?.name || appt.pet_name || "Unknown Pet"}
                                    subtitle={`${appt.visit_type || appt.visitType || "Visit"} • ${appt.appointment_time || appt.time || "--:--"}`}
                                    status={normalizedStatus}
                                    assignedTo={appt.owner_name || appt.owner || "Unknown"}
                                    actionLabel="View Details"
                                    onAction={() => {
                                        router.push(`/partner/myAppointments/petDetails/${appt.appointment_id || appt.id}`);
                                    }}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState 
                        title="No upcoming appointments" 
                        description="You have no more appointments scheduled for today." 
                    />
                )}
            </div>
        </OperationsShell>
    );
}

export default function PartnerDashboard() {
    return (
        <Suspense fallback={<LoadingState fullScreen />}>
            <PartnerDashboardContent />
        </Suspense>
    );
}

