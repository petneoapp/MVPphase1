"use client";

import { FaCirclePlus } from "react-icons/fa6";
import React, { useEffect, useRef, useState } from "react";
import { Pet, User } from "@/app/customer/dashboard/page";
import { PageType } from "@/app/customer/dashboard/constants";
import { api, clearAuth } from "@/utils/api";
import { transformAppointments } from "./cMyAppointments";
import { AppointmentDetails } from "./appointmentStatus";
import DashboardGreeting from "./DashboardGreeting";
import QuickServices from "./QuickServices";
import RecentAppointments from "./RecentAppointments";
import { VISIT_ID } from "./cVetAppointmentBooking";
import { ErrorAlert } from "@/utils/commonTypes";
import { removeItemById } from "@/utils/common";
import { AlertBanner } from "@/components/common/AlertBanner";
import { DashboardErrorBoundary } from "@/components/common/DashboardErrorBoundary";

export enum ServiceName {
    VET = "Vet",
    GROOMING = "Grooming",
    BOARDING = "Boarding"
}

export type Service = {
    id: string;
    label: string;
    icon: string; // icon url or base64
    visit_type?: VISIT_ID;
    serviceName?: ServiceName;
};

interface C_DashboardMainProps {
    user: User | null;
    pets: Pet[];
    onViewPetDetails: (petId: number) => void;
    onPageTypeChange: (pageType: PageType) => void;
    onServiceSelection: (service: Service) => void;
    onAppointmentSelection?: (appointmentId: number) => void;
}


export default function C_DashboardMain({ user, pets, onViewPetDetails, onPageTypeChange, onServiceSelection, onAppointmentSelection }: C_DashboardMainProps) {

    const services: Service[] = [
    {
        id: "clinicVisit",
        label: "Clinic Visit",
        icon: "/images/customer/clinic_icon.png",
        visit_type: VISIT_ID.CLINIC_VISIT
    },
    {
        id: "homeVisit",
        label: "Home Visit",
        icon: "/images/customer/homeVisit_icon.png",
        visit_type: VISIT_ID.HOME_VISIT
    },
    {
        id: "online",
        label: "Online",
        icon: "/images/customer/online_icon.png",
        visit_type: VISIT_ID.ONLINE
    },
    {
        id: 'boarding',
        label: "Boarding",
        icon: "/images/customer/boarding_icon.png",
        serviceName:ServiceName.BOARDING
    },
    {
        id: "grooming",
        label: "Grooming",
        icon: "/images/customer/grooming_icon.png",
        serviceName:ServiceName.GROOMING
    },
    {
        id: "vaccination",
        label: "Vaccination",
        icon: "/images/customer/vaccination_icon.png",
    },
    ];

    const HandleClickOnServices = (service: Service) => {
        onServiceSelection(service);
        if (service.id === "clinicVisit" || service.id === "homeVisit" || service.id === "online"
            || service.id === "grooming" || service.id === "boarding") {
            onPageTypeChange(PageType.VET_DETAILS);
        }
    };

    const HandleViewAllAppointments = () => {
        onPageTypeChange(PageType.MY_APPOINTMENTS);
    };

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const [myAppointments, setMyAppointments] = useState<AppointmentDetails[]>([]);
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
                    const transformedAppointments = transformAppointments(res1.appointments).slice(0,3);
                    setMyAppointments(transformedAppointments);
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
                if (error?.message.includes("403")) {
                    clearAuth();
                    window.location.href = "/login";
                 }
            }).finally(() => {
                setLoading(false);
            });
        }
    }, []);

    return (
        <div className="px-6 py-6 max-w-7xl mx-auto space-y-10">
            {/* Show all visible error banners */}
            {errors.map(e => (
                <div key={e.id} className="mb-4">
                    <AlertBanner
                        type="danger"
                        title={e.title}
                        message={e.message}
                        onDismiss={() => handleDismiss(e.id)}
                    />
                </div>
            ))}

            <DashboardErrorBoundary sectionName="My Pets">
                <DashboardGreeting
                    user={user}
                    pets={pets}
                    onPetClick={onViewPetDetails}
                    onAddPet={() => onViewPetDetails(-1)}
                    loading={loading}
                />
            </DashboardErrorBoundary>

            <DashboardErrorBoundary sectionName="Quick Services">
                <QuickServices
                    services={services}
                    onServiceClick={HandleClickOnServices}
                />
            </DashboardErrorBoundary>

            <DashboardErrorBoundary sectionName="My Appointments">
                <RecentAppointments
                    appointments={myAppointments}
                    onViewAll={HandleViewAllAppointments}
                    onAppointmentClick={(appt) => {
                        if (onAppointmentSelection && appt.id) {
                            onAppointmentSelection(appt.id);
                        } else {
                            HandleViewAllAppointments();
                        }
                    }}
                    loading={loading}
                />
            </DashboardErrorBoundary>
      </div>
    );
}
