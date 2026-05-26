"use client";

import {ErrorAlert, PartnerMyAppointments} from "@/utils/commonTypes";
import React, {useEffect, useRef, useState} from "react";
import PartnerAppointmentCard from "@/components/partner/PartnerAppointmentCard";
import {api} from "@/utils/api";
import FullScreenLoader from "@/components/customer/fullScreenLoader";
import {removeItemById} from "@/utils/common";
import {ErrorBanner} from "@/components/common/ErrorBanner";

const TABS = ['Upcoming', 'Completed', 'Ongoing', 'No Show'] as const;
type TabType = (typeof TABS)[number];

export default function PartnerMyAppointmentsPage()  {

    const [appointmentsData, setAppointmentsData] = useState<PartnerMyAppointments>();

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(false);
    const fetchMyAppointmentsData = () => {
        setLoading(true);
        setErrors(curr => removeItemById(curr, "get-my-appointments-api"));
        const myAppointmentsDataPromise = api.get("/appointments/myAppointments", undefined, "partner");
        Promise.all([myAppointmentsDataPromise]).then(([myAppointmentsDataRes]) => {
            //setting my appointments data
            setAppointmentsData(myAppointmentsDataRes);

            hasFetched.current = false;
            setLoading(false);
        }).catch((error) => {
            setLoading(false);
            setErrors(curr => [
                ...curr,
                {
                    id: 'get-my-appointments-api',
                    title: `API Error while fetching your appointments`,
                    message: error.message || 'Unknown error'
                }
            ]);
        })
    };
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchMyAppointmentsData();
        }
    }, []);

    const [currentTab, setCurrentTab] = useState<TabType>('Upcoming');

    const getTabKey = (tab: TabType): keyof PartnerMyAppointments => {
        const keyMap: Record<TabType, keyof PartnerMyAppointments> = {
            Upcoming: 'upcoming',
            Completed: 'completed',
            Ongoing: 'on-going',
            'No Show': 'no-show',
        };
        return keyMap[tab];
    };

    const appointments = appointmentsData?.[getTabKey(currentTab)] || [];

    const refreshTheAppointments = () => {
        fetchMyAppointmentsData();
    }
    return (
        <>
            {/* Show all visible error banners */}
            {errors.map(e => (
                <ErrorBanner
                    key={e.id}
                    title={e.title}
                    message={e.message}
                    visible={true}
                    onDismiss={() => handleDismiss(e.id)}
                />
            ))}
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
                        <div className="flex gap-8 border-b border-gray-200">
                            {TABS.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setCurrentTab(tab)}
                                    className={`pb-3 px-2 font-medium transition-colors whitespace-nowrap ${
                                        currentTab === tab
                                            ? 'text-pink-600 border-b-2 border-pink-600'
                                            : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appointments Grid */}
                    {appointments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No appointments found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {appointments.map((appointment) => (
                                <PartnerAppointmentCard
                                    key={appointment.appointment_id}
                                    appointment={appointment}
                                    isCountdownNeeded={false}
                                    isViewDetailsNeeded={true}
                                    isRescheduleNeeded={currentTab === 'Upcoming'}
                                    refreshCards={refreshTheAppointments}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <FullScreenLoader loading={loading}/>
        </>
    );
}
