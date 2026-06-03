import { Pet } from '@/app/customer/dashboard/page';
import { PageType } from "@/app/customer/dashboard/constants";
import { api } from '@/utils/api';
import React, {useEffect, useState} from 'react';
import { FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaDog, FaCut } from 'react-icons/fa';
import { FcCancel } from 'react-icons/fc';
import { LiaPawSolid } from "react-icons/lia";
import { LoadingState } from "@/components/common/LoadingState";
import PopupModel from "./popupModel";
import SlotPicker, {DaySlots} from "./slotPicker";
import {
    convert12hTo24hPlusMinutes,
    DateTimeSlot,
    defaultNumberOfDays, defaultTimeSlotInMin,
    transformAvailability, VISIT_TYPES
} from "./cVetAppointmentBooking";
import {isAppointmentInFuture, removeItemById} from "@/utils/common";
import {ErrorAlert} from "@/utils/commonTypes";
import { AlertBanner } from "@/components/common/AlertBanner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TimelineView, TimelineEvent } from "@/components/common/TimelineView";

export type AppointmentStatusType = 'booked' | 'cancelled' | 'completed';
export interface AppointmentDetails {
    id: number | undefined;
    status: AppointmentStatusType;
    pet: Pet | undefined;
    vetName: string | undefined;
    vetSpecialization?: string | undefined;
    vetProfileUrl?: string | undefined;
    vetId?: number;
    visit_purpose?:  "General Visit" | "Emergency";
    visitType: string | undefined;
    service?: string | undefined;
    clinicName?: string | undefined;
    date: string | undefined;
    time: string | undefined;
    location?: string | undefined;
    cancellationReason?: string | undefined;
}

interface AppointmentStatusProps {
  appointmentDetails: AppointmentDetails;
   onPageTypeChange: (pageType: PageType) => void;
   makeSelectedAppointmentEmpty?: () => void; // this param should be only form myAppointments( to handle one of the edge case)
}

function formatDate(inputDate: string | undefined): string {
  const date = new Date(inputDate || '');

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  };

  return date.toLocaleDateString('en-US', options);
}


export default function AppointmentStatus({appointmentDetails, onPageTypeChange, makeSelectedAppointmentEmpty} : AppointmentStatusProps) {

    const [appointmentDate, setAppointmentDate] = useState<string>(appointmentDetails.date || "");
    const [appointmentTime, setAppointmentTime] = useState<string>(appointmentDetails.time || "");

    const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatusType>(appointmentDetails.status);

    const [showEditOptions, setShowEditOptions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const [popupErrors, setPopupErrors] = useState<ErrorAlert[]>([]);

    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const handlePopupErrorsDismiss = (id: string) => {
        setPopupErrors(curr => curr.filter(e => e.id !== id));
    };

    async function handleCancelAppointment(): Promise<void> {
    if (appointmentDetails.id) {
        try {
            setLoading(true);
            setErrors(removeItemById(errors, "cancel-appointment"));
            //making patch call to update the status of the appointment
            const res = await api.patch(`/user/appointment/${appointmentDetails.id}/status`, {}, {status: "cancelled"});
            setAppointmentStatus("cancelled");
        } catch (error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'cancel-appointment',
                    title: `API Error while cancelling your appointment`,
                    message: error.message || 'Unknown error'
                }
            ]);
        } finally {
            setLoading(false);
        }


    } 
  }

  async function handleDeleteAppointment(): Promise<void> {
    if (appointmentDetails.id) {
        const confirmDelete = window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.");
        if (!confirmDelete) return;

        try {
            setLoading(true);
            setErrors(removeItemById(errors, "delete-appointment"));
            const res = await api.delete(`/user/appointment/${appointmentDetails.id}`);
            if (res.success) {
                alert("Appointment deleted successfully.");
                handleViewMyAppointments();
            } else {
                throw new Error(res.message || "Failed to delete appointment");
            }
        } catch (error: any) {
            setErrors(curr => [
                ...curr,
                {
                    id: 'delete-appointment',
                    title: `API Error while deleting your appointment`,
                    message: error.message || 'Unknown error'
                }
            ]);
        } finally {
            setLoading(false);
        }
    }
  }

  const [isReschedulePopupOpen, setIsReschedulePopupOpen] = useState<boolean>(false);
    function handleRescheduleAppointment(): void {
        if (appointmentDetails.id) {
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
                    visit_type: VISIT_TYPES.find((item) => item.displayName === appointmentDetails.visitType)?.id,
                };
                setErrors(removeItemById(errors, "reschedule-appointment"));

                //reschedule the appointment
                const rescheduleAppointmentRes = await api.put(`/availability/user/reschedule/${appointmentDetails.id}`, payload);
                setLoading(false);
                if (rescheduleAppointmentRes.success) {
                    //assign the new data to current appointment
                    setAppointmentDate(selectedDateTimeSlot.date);
                    setAppointmentTime(selectedDateTimeSlot.time);
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
                setRescheduleAvailability([]);
                setSelectedDateTimeSlot(undefined);
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
            if (isReschedulePopupOpen && appointmentDetails.id) {
                try {
                    //fetching the reschedule slots.
                    setLoading(true);
                    setPopupErrors(removeItemById(popupErrors, "reschedule-slots"));
                    const fetchRescheduleSlots = await api.get(`/availability/${appointmentDetails.id}/rescheduleSlots`, {days: defaultNumberOfDays});
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

  function handleGoHome(): void {
    //navigating to the dashboard home
    onPageTypeChange(PageType.DASHBOARD);
  }

  function handleViewMyAppointments(): void {
    //navigating to the my appointments page
    onPageTypeChange(PageType.MY_APPOINTMENTS);
    makeSelectedAppointmentEmpty?.();
  }

  if (loading) {
      return <LoadingState fullScreen message="Processing..." />;
  }

  const timelineEvents: TimelineEvent[] = [
      {
          id: "1",
          title: appointmentDetails.visitType || "Visit",
          description: `Service: ${appointmentDetails.service || 'General'}`,
          timestamp: `${formatDate(appointmentDate)} - ${appointmentTime}`,
          actor: {
              name: `Dr. ${appointmentDetails.vetName || ""}`,
              avatarUrl: appointmentDetails.vetProfileUrl,
          },
          status: appointmentStatus === 'completed' ? 'success' : appointmentStatus === 'cancelled' ? 'danger' : 'info'
      },
      {
          id: "2",
          title: "Location Details",
          description: appointmentDetails.location || appointmentDetails.clinicName,
          timestamp: "",
          status: "info"
      }
  ];

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
          <div className="flex flex-col items-center min-h-screen justify-center bg-[#f9fafb]">
              <div className="w-full max-w-lg py-8 px-4 flex flex-col items-center bg-white shadow rounded-lg border border-gray-200 my-10">
                  <div className="mb-4">
                      {appointmentStatus === 'booked' && (
                          <StatusBadge status="success" label="Appointment Booked" />
                      )}
                      {appointmentStatus === 'cancelled' && (
                          <StatusBadge status="danger" label="Appointment Cancelled" />
                      )}
                      {appointmentStatus === 'completed' && (
                          <StatusBadge status="info" label="Appointment Completed" />
                      )}
                  </div>
                  
                  {appointmentStatus === "cancelled" && appointmentDetails.cancellationReason && (
                      <span className="mb-4 text-sm text-gray-700">Reason: {appointmentDetails.cancellationReason}</span>
                  )}
                  
                  <div className="w-full mb-6 text-left">
                      <TimelineView events={timelineEvents} />
                  </div>

                  {appointmentStatus === 'booked' && (
                      <>
                          <div className="w-full mb-6">
                              <h3 className="font-semibold text-sm mb-1">Cancellation Policy</h3>
                              <ul className="text-xs text-gray-500 list-disc list-inside">
                                  <li>Users can cancel a booking/service up to 24 hours before the scheduled time with no charge.</li>
                                  <li>
                                      Cancellations made within 24 hours of the appointment or failure to show up will result in a cancellation fee (up to 100% of service cost).
                                  </li>
                              </ul>
                          </div>
                              <div className="w-full flex flex-col gap-2 mb-3">
                                  {!showEditOptions ? (
                                      <button className="w-full text-white bg-pink-500 rounded-lg py-3 font-semibold transition hover:bg-pink-600"
                                              onClick={() => setShowEditOptions(true)}>
                                          Edit Appointment
                                      </button>
                                  ) : (
                                      <div className="flex flex-col gap-2 w-full">
                                          <button className="w-full text-white bg-pink-500 rounded-lg py-3 font-semibold transition hover:bg-pink-600"
                                                  onClick={handleRescheduleAppointment}>
                                              Reschedule Appointment
                                          </button>
                                          <button className="w-full text-white bg-red-500 rounded-lg py-3 font-semibold transition hover:bg-red-600"
                                                  onClick={handleDeleteAppointment}>
                                              Delete Appointment
                                          </button>
                                          <button className="w-full text-white bg-gray-500 rounded-lg py-3 font-semibold transition hover:bg-gray-600"
                                                  onClick={handleCancelAppointment}>
                                              Cancel Appointment
                                          </button>
                                          <button className="w-full text-gray-700 bg-gray-200 rounded-lg py-3 font-semibold transition hover:bg-gray-300"
                                                  onClick={() => setShowEditOptions(false)}>
                                              Cancel Edit
                                          </button>
                                      </div>
                                  )}
                              </div>
                              <button className="w-full text-white bg-pink-500 rounded-lg py-3 my-3 font-semibold transition hover:bg-pink-600"
                                      onClick={handleViewMyAppointments}>
                                  View My Appointments
                              </button>
                          </>
                      )}
                      {(appointmentStatus === "cancelled" || appointmentStatus === "completed") && (
                          <div className="w-full flex flex-col gap-2">
                              <button className="w-full text-white bg-red-500 rounded-lg py-3 font-semibold transition hover:bg-red-600"
                                      onClick={handleDeleteAppointment}>
                                  Delete Appointment
                              </button>
                              <button className="w-full text-white bg-pink-500 rounded-lg py-3 font-semibold transition hover:bg-pink-600"
                                      onClick={handleGoHome}>
                                  Go Home
                              </button>
                          </div>
                      )}
              </div>
              <PopupModel open={isReschedulePopupOpen} onCancel={handlePopupCancel} onPrimary={handlePrimaryAction} primaryLabel="Reschedule">
                  <div className="flex sticky bg-white top-0 z-50 justify-center">
                      <span className="text-md font-semibold text-pink-600">Reschedule Appointments</span>
                  </div>
                  {/* Show all visible error banners */}
                  {popupErrors.map(e => (
                      <div key={e.id} className="mb-4">
                          <AlertBanner
                              type="danger"
                              title={e.title}
                              message={e.message}
                              onDismiss={() => handlePopupErrorsDismiss(e.id)}
                          />
                      </div>
                  ))}
                  <SlotPicker vetAvailability={rescheduleAvailability} onChange={handleSlotPickerValueChange}/>
              </PopupModel>
          </div>
      </>

  );
};

