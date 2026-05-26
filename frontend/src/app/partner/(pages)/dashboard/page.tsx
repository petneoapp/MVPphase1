"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import FullScreenLoader from "@/components/customer/fullScreenLoader";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { usePartnerDashboardData } from "@/hooks/usePartnerDashboardData";
import PartnerGreeting from "@/components/partner/PartnerGreeting";
import PartnerUpcomingAppointments from "@/components/partner/PartnerUpcomingAppointments";
import { DashboardErrorBoundary } from "@/components/common/DashboardErrorBoundary";

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

    return (
        <>
            {/* Show all visible error banners */}
            {errors.map(e => (
                <ErrorBanner
                    key={e.id}
                    title={e.title}
                    message={e.message}
                    visible={true}
                    onDismiss={() => dismissError(e.id)}
                />
            ))}
            <div className="px-6 py-6 max-w-7xl mx-auto space-y-10">
                <DashboardErrorBoundary sectionName="Today's Summary">
                    <PartnerGreeting 
                        partnerDetails={partnerDetails} 
                        onSeeAll={handleSeeAll} 
                    />
                </DashboardErrorBoundary>
                
                <DashboardErrorBoundary sectionName="Upcoming Appointments">
                    <PartnerUpcomingAppointments 
                        upcomingAppointments={partnerDetails.upcoming} 
                        onSeeAll={handleSeeAll} 
                    />
                </DashboardErrorBoundary>
            </div>
            <FullScreenLoader loading={loading}/>
        </>
    );
}

export default function PartnerDashboard() {
    return (
        <Suspense fallback={<FullScreenLoader loading={true} />}>
            <PartnerDashboardContent />
        </Suspense>
    );
}
