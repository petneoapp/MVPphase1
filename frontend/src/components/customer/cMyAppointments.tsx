"use client";

import { Pet } from "@/app/customer/dashboard/page";
import { PageType } from "@/app/customer/dashboard/constants";
import { api } from "@/utils/api";
import React, { useEffect, useRef, useState } from "react";
import { FaFilter, FaArrowLeft } from "react-icons/fa";
import AppointmentStatus, { AppointmentDetails, AppointmentStatusType } from "./appointmentStatus";
import { VISIT_ID, VISIT_TYPES } from "./cVetAppointmentBooking";
import { WorkflowCard } from "@/components/common/WorkflowCard";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorAlert } from "@/utils/commonTypes";
import { removeItemById } from "@/utils/common";
import { AlertBanner } from "@/components/common/AlertBanner";
import { EmptyAppointments } from "../common/EmptyStates";

interface C_MyAppointmentsProps {
    onPageTypeChange: (pageType: PageType) => void;
}

export function transformAppointments(responseArray: []): AppointmentDetails[] {
    const transformed = responseArray.map((item: any) => {
        return {
            id: item?.appointment_id as number,
            status: item?.status as AppointmentStatusType,
            pet: {
                    id: item?.pet?.id,
                    name: item?.pet?.name,
                    profile_url: item?.pet?.profile_picture
                } as Pet,
            vetName: item?.vet?.name as string,
            vetSpecialization: item?.vet?.specialization as string,
            vetProfileUrl: item?.vet?.profile as string,
            vetId: item?.vet?.id as number,
            clinicName: item?.vet?.clinic_name as string,
            visit_purpose: item?.visit_purpose === "General visit" ? "General Visit" : "Emergency",
            visitType: VISIT_TYPES.find((x) => x.id === item?.visit_type)?.displayName,
            date: item?.date,
            time: item?.time,
            cancellationReason: item?.reason,
            noShowTag: item?.no_show_tag,
            noShowReason: item?.no_show_reason
        } as AppointmentDetails;
    });

    const now = new Date();
    transformed.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
        
        const isFutureA = dateA >= now ? 1 : -1;
        const isFutureB = dateB >= now ? 1 : -1;
        
        if (isFutureA !== isFutureB) {
            return isFutureB - isFutureA; // future comes first
        }
        
        if (isFutureA === 1) {
            // Both are future: nearest first (ascending)
            return dateA.getTime() - dateB.getTime();
        } else {
            // Both are past: most recent first (descending)
            return dateB.getTime() - dateA.getTime();
        }
    });

    return transformed;
}


export default function C_MyAppointments({ onPageTypeChange }: C_MyAppointmentsProps) {
    const [selectedTab, setSelectedTab] = useState<"active" | "cancelled" | "completed">("active");

    const [activeAppointments, setActiveAppointments] = useState<AppointmentDetails[]>([]);
    const [completedAppointment, setCompletedAppointments] = useState<AppointmentDetails[]>([]);
    const [cancelledAppointments, setCancelledAppointments] = useState<AppointmentDetails[]>([]);

    const appointmentsToShow = selectedTab === "active" ? activeAppointments : selectedTab === 'completed' ? completedAppointment : cancelledAppointments;

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
            if (!hasFetched.current) {
            hasFetched.current = true;
            setErrors(removeItemById(errors, "get-my-appointments-api"));
            const userAppointmentDataFetch = api.get("/user/appointment/myAppointments");
            Promise.all([userAppointmentDataFetch]).then(([res1]) => {
                if (Array.isArray(res1?.appointments)) {
                    //transforming the api response into UI usable data
                    const transformedAppointments = transformAppointments(res1.appointments);

                    setActiveAppointments(transformedAppointments.filter((item: AppointmentDetails) => item.status === 'booked'));
                    setCompletedAppointments(transformedAppointments.filter((item: AppointmentDetails) => item.status === 'completed'));
                    setCancelledAppointments(transformedAppointments.filter((item: AppointmentDetails) => item.status === 'cancelled'));
                    setLoading(false);
                }
            }).catch((error) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'get-my-appointments-api',
                        title: `API Error while getting your appointments`,
                        message: error.message || 'Unknown error'
                    }
                ]);
                setLoading(false);
            });
        }
    }, []);

    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetails | null>(null);

    async function fetchAndSetSelectedAppointmentDetails(app: AppointmentDetails): Promise<void> {
        try {
            setLoading(true);
            setErrors(removeItemById(errors, "get-my-appointment-api"));
            //fetching appointment details
            // fetching this only for service and clinic details
            const userAppointmentRes = await api.get(`/user/appointment/${app.id}`);
            app.service = userAppointmentRes?.service;
            app.location = userAppointmentRes.visit_type === VISIT_ID.CLINIC_VISIT ? userAppointmentRes?.clinic_location :
                userAppointmentRes.visit_type === VISIT_ID.HOME_VISIT ? userAppointmentRes?.Visit_address?.address :
                    userAppointmentRes.visit_type === VISIT_ID.ONLINE ? "Online" : "";
            setSelectedAppointment(app);
            setLoading(false);
        } catch (error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'get-my-appointment-api',
                    title: `API Error while getting your appointment selected`,
                    message: error.message || 'Unknown error'
                }
            ]);
            setLoading(false);
        }
    }

    if (loading) {
        return <LoadingState fullScreen message="Loading appointments..." />;
    }

    return (
        <>
            {/* Show all visible error banners */}
            {errors.map(e => (
                <div key={e.id} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <AlertBanner
                        type="danger"
                        title={e.title}
                        message={e.message}
                        onDismiss={() => handleDismiss(e.id)}
                    />
                </div>
            ))}
            
            {!selectedAppointment && 
            <div className="min-h-screen bg-purple-50 px-10 py-6">
                {/* Tabs and search section */}
                <div className="flex gap-4 items-center mb-7 text-sm">
                    <button 
                        onClick={() => onPageTypeChange(PageType.DASHBOARD)}
                        className="flex items-center text-gray-600 hover:text-pink-500 mr-2"
                    >
                        <FaArrowLeft className="mr-2" /> Back
                    </button>
                    <div className="flex bg-pink-200 rounded-full">
                    <button
                        onClick={() => setSelectedTab("active")}
                        className={`font-semibold px-6 py-2 rounded-full transition cursor-pointer ${
                        selectedTab === "active"
                            ? "bg-pink-400 text-white"
                            : "bg-transparent text-pink-400"
                        }`}
                    >
                        My Appointments
                    </button>
                    <button
                        onClick={() => setSelectedTab("cancelled")}
                        className={`font-semibold px-6 py-2 rounded-full transition cursor-pointer ${
                        selectedTab === "cancelled"
                            ? "bg-pink-400 text-white"
                            : "bg-transparent text-pink-400"
                        }`}
                    >
                        Cancelled Appointments
                    </button>
                    <button
                        onClick={() => setSelectedTab("completed")}
                        className={`font-semibold px-6 py-2 rounded-full transition cursor-pointer ${
                        selectedTab === "completed"
                            ? "bg-pink-400 text-white"
                            : "bg-transparent text-pink-400"
                        }`}
                    >
                        Completed Appointments
                    </button>
                    </div>
                    <div className="flex flex-1 items-center ml-5 bg-white rounded-full px-4 py-2 shadow max-w-lg">
                    <input
                        type="text"
                        placeholder="Search for Appointments"
                        className="flex-1 border-none focus:ring-0 outline-none bg-transparent"
                    />
                    <FaFilter className="text-pink-500 text-xl" />
                    </div>
                </div>

                {appointmentsToShow.length === 0 && <EmptyAppointments />}
                
                {/* Grid of cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    {appointmentsToShow.map(app => {
                        const normalizedStatus = app.status === 'completed' ? 'success' 
                                               : app.status === 'cancelled' ? 'danger' 
                                               : 'info';
                                               
                        return (
                            <WorkflowCard 
                                key={app.id} 
                                title={`Dr. ${app.vetName}`}
                                subtitle={`${app.visitType || app.visit_purpose || "Visit"} • ${app.date} ${app.time}`}
                                status={normalizedStatus}
                                assignedTo={app.clinicName || app.location}
                                actionLabel="View Details"
                                onAction={() => fetchAndSetSelectedAppointmentDetails(app)}
                            />
                        );
                    })}
                </div>
            </div>
            }
            {selectedAppointment && (
                <AppointmentStatus 
                    appointmentDetails={selectedAppointment} 
                    onPageTypeChange={onPageTypeChange} 
                    makeSelectedAppointmentEmpty={() => setSelectedAppointment(null)}
                />
            )}
        </>
    );
}
