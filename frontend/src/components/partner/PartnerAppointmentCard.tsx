'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import { FaCalendarAlt } from 'react-icons/fa';
import {ErrorAlert, PartnerAppointment} from "@/utils/commonTypes";
import {formatDate1, getRemainingTime, removeItemById} from "@/utils/common";
import {useRouter} from "next/navigation";
import SlotPicker, {DaySlots} from "../customer/slotPicker";
import PopupModel from "../customer/popupModel";
import {
    convert12hTo24hPlusMinutes,
    DateTimeSlot, defaultNumberOfDays,
    defaultTimeSlotInMin, transformAvailability,
    VISIT_TYPES
} from "../customer/cVetAppointmentBooking";
import {api} from "@/utils/api";
import SimpleLoader from "../common/SimpleLoader";
import {ErrorBanner} from "../common/ErrorBanner";

interface PartnerAppointmentCardProps {
    isCountdownNeeded?: boolean;
    isViewDetailsNeeded?: boolean;
    isRescheduleNeeded?: boolean;
    refreshCards?: () => void;
    appointment: PartnerAppointment;
}

const PartnerAppointmentCard = React.memo(function PartnerAppointmentCard ({ appointment, isCountdownNeeded= true, isViewDetailsNeeded=false, isRescheduleNeeded=false, refreshCards }: PartnerAppointmentCardProps) {
    const router = useRouter();
    const handleViewDetails = () => {
        //need to route to myAppointments/petDetails page
        router.push(`/partner/myAppointments/petDetails/${appointment.pet.id}`);
    }

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const [popupErrors, setPopupErrors] = useState<ErrorAlert[]>([]);

    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const handlePopupErrorsDismiss = (id: string) => {
        setPopupErrors(curr => curr.filter(e => e.id !== id));
    };

    const [loading, setLoading] = useState<boolean>(false);
    const [isReschedulePopupOpen, setIsReschedulePopupOpen] = useState<boolean>(false);
    const handleRescheduleAppointment = () => {
        if (appointment.appointment_id) {
            setIsReschedulePopupOpen(true);
        }
    }

    const handlePopupCancel = () => {
        setIsReschedulePopupOpen(false);
        setRescheduleAvailability([]);
        setSelectedDateTimeSlot(undefined);
    };

    const handlePrimaryAction = async () => {
        if (selectedDateTimeSlot && selectedDateTimeSlot.date &&
            selectedDateTimeSlot.time) {
            try {
                setLoading(true);
                const payload= {
                    new_date: selectedDateTimeSlot.date,
                    new_start_time: convert12hTo24hPlusMinutes(selectedDateTimeSlot.time),
                    new_end_time: convert12hTo24hPlusMinutes(selectedDateTimeSlot.time, defaultTimeSlotInMin),
                    visit_type: appointment.visit_type,
                };

                setErrors(removeItemById(errors, "reschedule-appointment"));
                //reschedule the appointment
                const rescheduleAppointmentRes = await api.put(`/availability/reschedule/${appointment.appointment_id}`, payload, "partner");
                setLoading(false);
                if (rescheduleAppointmentRes?.detail === "Appointment rescheduled successfully") {
                    if (isRescheduleNeeded && refreshCards) {
                        refreshCards();
                    }
                }
            } catch (error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'reschedule-appointment',
                        title: `API Error while rescheduling your appointment`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            } finally {
                setLoading(false);
                setIsReschedulePopupOpen(false);
            }
        } else {
            alert("Please choose a slot to reschedule");
        }
    }

    const [selectedDateTimeSlot, setSelectedDateTimeSlot] = useState<DateTimeSlot>();
    function handleSlotPickerValueChange(selected: { date: string; time: string; }): void {
        setSelectedDateTimeSlot(selected);
    }

    const [rescheduleAvailability, setRescheduleAvailability] = useState<DaySlots[]>([]);

    useEffect(() => {
        (async () => {
            if (isReschedulePopupOpen && appointment.appointment_id) {
                try {
                    //fetching the reschedule slots.
                    setLoading(true);
                    setPopupErrors(removeItemById(popupErrors, "reschedule-slots"));
                    const fetchRescheduleSlots = await api.get(`/availability/${appointment.appointment_id}/rescheduleSlots`, {days: defaultNumberOfDays});
                    if (Array.isArray(fetchRescheduleSlots)) {
                        setRescheduleAvailability(transformAvailability(fetchRescheduleSlots));
                    }
                } catch (error: any) {
                    setPopupErrors(curr => [
                        ...curr,
                        {
                            id: 'reschedule-slots',
                            title: `API Error while getting reschedule slots`,
                            message: error.message || 'Unknown error'
                        }
                    ]);
                } finally {
                    setLoading(false);
                }
            }
        })();
    }, [isReschedulePopupOpen]);

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4 w-full max-w-sm border border-gray-100">
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
                {/* Header with Calendar Icon and Time */}
                {isCountdownNeeded &&
                    <div className="flex items-center gap-2 bg-blue-100 rounded-lg p-3">
                        <FaCalendarAlt className="text-blue-600 text-sm"/>
                        <span className="text-blue-600 text-sm font-semibold">
                    Your next Appointment in{' '}
                            <span className="text-blue-700 underline font-bold">{getRemainingTime(appointment.date, appointment.time)}</span>
                </span>
                    </div>}
                {/* Main Content */}
                <div className="flex gap-4 items-center">
                    {/* Pet Image */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                            src={appointment.pet.profile_picture}
                            alt={appointment.pet.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    </div>

                    {/* Pet Info */}
                    <div className="flex-1 flex flex-col gap-1">
                        <h3 className="font-semibold text-sm text-gray-800">{appointment.pet.name}</h3>
                        <p className="text-xs text-gray-600">{appointment.pet.breed}</p>
                        <p className="text-[10px] text-gray-500">{formatDate1(appointment.date)}</p>
                    </div>

                    {/*    /!* Visit Type Badge *!/*/}
                    {/*    <div className="flex-shrink-0">*/}
                    {/*<span className="bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium text-xs whitespace-nowrap">*/}
                    {/*  {appointment.visitType}*/}
                    {/*</span>*/}
                    {/*    </div>*/}
                </div>

                {/*Action buttons*/}
                <div className={`flex flex-row ${isRescheduleNeeded ? "justify-between" : "justify-center"}`}>
                    {isRescheduleNeeded &&
                        <button className="w-[45%] px-4 py-2 border-2 border-pink-600 text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition"
                                onClick={handleRescheduleAppointment}>
                            Reschedule
                        </button>
                    }
                    { isViewDetailsNeeded &&
                        <button className="w-[45%] px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition"
                                onClick={handleViewDetails}>
                            View Details
                        </button>
                    }

                </div>
                <PopupModel open={isReschedulePopupOpen} onCancel={handlePopupCancel} onPrimary={handlePrimaryAction} primaryLabel="Reschedule">
                    {/* Show all visible error banners */}
                    {popupErrors.map(e => (
                        <ErrorBanner
                            key={e.id}
                            title={e.title}
                            message={e.message}
                            visible={true}
                            onDismiss={() => handlePopupErrorsDismiss(e.id)}
                        />
                    ))}
                    <div className="flex sticky bg-white top-0 z-50 justify-center">
                        <span className="text-md font-semibold text-pink-600">Reschedule Appointments</span>
                    </div>
                    <SlotPicker vetAvailability={rescheduleAvailability} onChange={handleSlotPickerValueChange}/>
                    <SimpleLoader isLoading={loading}/>
                </PopupModel>
            </div>
        </>

    );
});

export default PartnerAppointmentCard;
