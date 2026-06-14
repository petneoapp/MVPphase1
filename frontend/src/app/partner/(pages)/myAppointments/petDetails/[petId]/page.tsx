'use client';

import { useParams, useRouter } from 'next/navigation';
import React, {useEffect, useMemo, useRef, useState} from "react";
import {FaMapLocationDot, FaWeightScale} from "react-icons/fa6";
import {MdCheckCircle, MdDateRange, MdMale} from "react-icons/md";
import {FaCalendarAlt, FaClock, FaFileContract, FaPhone, FaPlus, FaSyringe} from "react-icons/fa";
import Image from "next/image";
import {LuBone, LuDog} from "react-icons/lu";
import {api} from "@/utils/api";
import { LoadingState } from "@/components/common/LoadingState";
import {
    ErrorAlert,
    PartnerPetAppointmentDetails,
    PartnerPetCompleteDetails,
    PartnerPetDetails, PetNewPrescriptionDetails, PetNewVaccinationDetails,
    PetOwnerDetails, PetPrescriptionDetails, PetVaccinationDetails
} from "@/utils/commonTypes";
import PopupModel from "@/components/customer/popupModel";
import {AlertCircle} from "lucide-react";
import {removeItemById} from "@/utils/common";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TimelineView } from "@/components/common/TimelineView";

export default function PetDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const petId = params.petId as string;

    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const [petCompleteDetails, setPetCompleteDetails] = useState<PartnerPetCompleteDetails>();

    const fetchCompletePetDetails = () => {
        setErrors(curr => removeItemById(curr, "get-pet-details-api"));
        const petDetailsDataPromise = api.get(`/pets/${petId}`, undefined, "partner");
        Promise.all([petDetailsDataPromise]).then(([petDetailsDataRes]) => {
            //setting the partner data
            setPetCompleteDetails(petDetailsDataRes)

            hasFetched.current = false;
            setLoading(false);
        }).catch((error) => {
            setLoading(false);
            setErrors(curr => [
                ...curr,
                {
                    id: 'get-pet-details-api',
                    title: `API Error while fetching pets details`,
                    message: error.message || 'Unknown error'
                }
            ]);
        })
    };

    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchCompletePetDetails();
        }
    }, []);

    const [activeTab, setActiveTab] = useState<'visit-details' | 'pet-info' | 'medical-history' | 'timeline'>(
        'visit-details'
    );
    const [fullTimeline, setFullTimeline] = useState<any[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'timeline' && fullTimeline.length === 0) {
            setTimelineLoading(true);
            api.get(`/pets/${petId}/full_timeline`, undefined, "partner")
                .then(res => setFullTimeline(res?.timeline || []))
                .catch(err => {
                    setErrors(curr => [...curr, { id: 'timeline-err', title: 'Error', message: err.message || 'Failed to fetch timeline' }]);
                })
                .finally(() => setTimelineLoading(false));
        }
    }, [activeTab]);

    const pet = useMemo<PartnerPetDetails | undefined>(() => {
        return petCompleteDetails?.pet;
    }, [petCompleteDetails]);
    const Owner = useMemo<PetOwnerDetails | undefined>(() => {
        return petCompleteDetails?.Owner;
    }, [petCompleteDetails]);
    const visit_history = useMemo<PartnerPetAppointmentDetails[] | undefined>(() => {
        return petCompleteDetails?.visit_history;
    }, [petCompleteDetails]);
    const vaccinations = useMemo<PetVaccinationDetails[] | undefined>(() => {
        return petCompleteDetails?.vaccinations;
    }, [petCompleteDetails]);
    const prescriptions = useMemo<PetPrescriptionDetails[] | undefined>(() => {
        return petCompleteDetails?.prescriptions;
    }, [petCompleteDetails]);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const infoFields = useMemo(() => {
        return [
            { icon: LuBone, label: 'Species', value: pet?.species || "" },
            { icon: LuDog, label: 'Breeding', value: pet?.breeding || "" },
            { icon: MdMale, label: 'Gender', value: pet?.gender || "" },
            { icon: MdDateRange, label: 'Age', value: pet?.age || "" },
            { icon: FaWeightScale, label: 'Weight', value: `${pet?.weight  || ""} Kgs` },
            { icon: FaFileContract, label: 'Licence', value: pet?.licence  || "" },
        ];
    }, [pet]);

    const ownerInfoFields = useMemo(() => {
        return [
            { icon: FaPhone, label: 'Contact', value: Owner?.contact_number  || "" },
            { icon: FaMapLocationDot, label: 'Address', value: Owner?.address  || "" }
        ];
    }, [Owner]);

    const today = new Date();
    const [newVaccinationRecord, setNewVaccinationRecord] = useState<PetNewVaccinationDetails>({});
    const [isAddVaccinationPopupOpen, setIsAddVaccinationPopupOpen] = useState<boolean>(false);
    useEffect(() => {
        if(isAddVaccinationPopupOpen) {
            setNewVaccinationRecord({pet_id: petId});
        } else {
            setNewVaccinationRecord({});
        }
    }, [isAddVaccinationPopupOpen]);
    const handleAddVaccination = () => {
        setIsAddVaccinationPopupOpen(true);
    };
    const handleVaccinationPopupCancel = () => {
        setIsAddVaccinationPopupOpen(false);
    };
    const handleNewVaccinationRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewVaccinationRecord({
            ...newVaccinationRecord,
            [e.target.name]: e.target.value
        });
    };

    const handleVaccinationPopupPrimaryAction = async () => {
        if (newVaccinationRecord?.pet_id && newVaccinationRecord?.date_vaccinated &&
            newVaccinationRecord?.vaccination_name && newVaccinationRecord?.dose_type) {
            const formData = new FormData();
            formData.append("pet_id", newVaccinationRecord.pet_id.toString());
            formData.append("date_vaccinated", newVaccinationRecord.date_vaccinated);
            formData.append("vaccination_name", newVaccinationRecord.vaccination_name);
            formData.append("dose_type", newVaccinationRecord.dose_type);

            let createVaccinationRecordResponse;
            try {
                //send the details to backend and close the popup.
                setLoading(true);
                setErrors(curr => removeItemById(curr, "create-vaccination-api"));
                createVaccinationRecordResponse = await api.formDatapost("/pets/addVaccination", formData, "partner");
                setLoading(false);

                if (createVaccinationRecordResponse) {
                    //refreshing the vaccinations list
                    fetchCompletePetDetails();
                }
            } catch(error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'create-vaccination-api',
                        title: `API Error while creating vaccination record`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            } finally {
                setLoading(false);
                setIsAddVaccinationPopupOpen(false);
            }
        } else {
            alert("Please provide all the details");
        }
    };


    const [pastAppointments, setPastAppointments] = useState<PartnerPetAppointmentDetails[]>([]);
    // Filter and sort past appointments on mount
    useEffect(() => {
        const filterPastAppointments = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const past = visit_history?.filter((apt) => {
                const aptDate = new Date(apt.date + 'T00:00:00');
                return aptDate < today;
            });

            // Sort by date descending (most recent first)
            past?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setPastAppointments(past || []);
        };

        filterPastAppointments();
    }, [visit_history]);

    const [newPrescriptionRecord, setNewPrescriptionRecord] = useState<PetNewPrescriptionDetails>({});
    const [isAddPrescriptionPopupOpen, setIsAddPrescriptionPopupOpen] = useState<boolean>(false);
    const handleAddPrescription = () => {
        setIsAddPrescriptionPopupOpen(true);
    };
    const handlePrescriptionPopupCancel = () => {
        setNewPrescriptionRecord({});
        setIsAddPrescriptionPopupOpen(false);
    };
    const handleNewPrescriptionRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewPrescriptionRecord({
            ...newPrescriptionRecord,
            [e.target.name]: e.target.value
        });
    };
    const handlePrescriptionPopupPrimaryAction = async () => {
        const hasAppointment = newPrescriptionRecord?.appointment_id && newPrescriptionRecord.appointment_id !== "direct";
        const hasFile = !!newPrescriptionRecord?.file;
        const hasText = !!newPrescriptionRecord?.text;

        if ((hasAppointment || pastAppointments.length === 0 || newPrescriptionRecord?.appointment_id === "direct") && (hasFile || hasText)) {
            const formData = new FormData();
            if (newPrescriptionRecord.appointment_id && newPrescriptionRecord.appointment_id !== "direct") {
                formData.append("appointment_id", newPrescriptionRecord.appointment_id);
            } else {
                formData.append("pet_id", petId);
            }
            if (newPrescriptionRecord.file) {
                formData.append("file", newPrescriptionRecord.file);
            }
            formData.append("text", newPrescriptionRecord?.text || "");

            let createPrescriptionRecordResponse;
            try {
                //send the details to backend and close the popup.
                setLoading(true);
                setErrors(curr => removeItemById(curr, "create-prescription-api"));
                createPrescriptionRecordResponse = await api.formDatapost("/pets/addPrescription", formData, "partner");
                setLoading(false);
                if (createPrescriptionRecordResponse) {
                    //refreshing the vaccinations list
                    fetchCompletePetDetails();
                }
            } catch (error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'create-prescription-api',
                        title: `API Error while creating prescription record`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            } finally {
                setLoading(false);
                setIsAddPrescriptionPopupOpen(false);
            }

        } else {
            alert("Please provide the required details (select appointment/consultation and provide prescription text or file)");
        }
    };

    const handleViewPrescription = (prescription: PetPrescriptionDetails) => {
        return () => {
            window.open(prescription.file_url);
        };
    };

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
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors cursor-pointer"
                    >
                        ← Back
                    </button>
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-nowrap items-center">
                            <div className="relative w-25 h-25 mx-6">
                                <Image
                                    src={pet?.profile_picture || "/images/d.png"}
                                    alt={pet?.name   || ""}
                                    fill
                                    className="rounded-full border-4 border-white shadow-lg object-cover"
                                    priority
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-xl font-bold text-gray-900">{pet?.name  || ""}</h1>
                                    {(pet as any)?.is_deleted && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
                                            Deleted Profile
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 text-xs">
                                    {pet?.species  || ""} | {pet?.age  || ""}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-8 justify-center flex-wrap">
                        {[
                            { id: 'visit-details', label: 'Visit Details' },
                            { id: 'pet-info', label: 'Pet Info' },
                            { id: 'medical-history', label: 'Medical History' },
                            { id: 'timeline', label: 'Timeline' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2 rounded-full cursor-pointer font-semibold text-sm transition-all duration-300 hover:translate-y-[-2px] ${
                                    activeTab === tab.id
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-pink-200 text-pink-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="transition-opacity duration-300">
                        {/* visit Details Tab */}
                        {activeTab === 'visit-details' && (
                            <div>
                                {(!visit_history ||  visit_history.length === 0) &&
                                    (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">No Visit History</p>
                                        </div>
                                    )
                                }
                                {visit_history?.map((appointment) => (
                                    <div
                                        key={appointment.appointment_id}
                                        className="bg-white border-2 border-purple-200 rounded-xl p-5 mb-5 flex justify-between items-center gap-4"
                                    >
                                        <div className="flex items-center flex-1">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl mr-4 flex-shrink-0 text-purple-600">
                                                <FaClock />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900 uppercase font-bold mb-1">
                                                    {appointment.date}
                                                </p>
                                                <p className="text-sm font-bold text-gray-900 mb-1">
                                                    {appointment.start_time} - {appointment.end_time}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {appointment.visit_type === 'in-clinic'
                                                        ? 'Consultation'
                                                        : appointment.visit_type === 'tele'
                                                            ? 'Online'
                                                            : 'Home Visit'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-cyan-300 text-cyan-900 uppercase px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0">
                                            {appointment.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pet Info Tab */}
                        {activeTab === 'pet-info' && (
                            <div>
                                <div className="w-full bg-blue-100 border-2 border-blue-400 rounded-lg p-4 my-8">
                                    <span className="text-base font-medium text-gray-700">Pet Name:</span>
                                    <span className="ml-2 text-gray-900 font-semibold text-base">{pet?.name || ""}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {infoFields.map((field, index) => {
                                        const IconComponent = field.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-purple-100 p-4 rounded-xl border border-purple-300 shadow-lg"
                                            >
                                                <p className="text-sm text-gray-600 mb-2 capitalize flex items-center gap-1.5">
                                                    <IconComponent className="text-lg text-purple-600" />
                                                    {field.label}
                                                </p>
                                                <p className="text-base font-bold text-gray-900">{field.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="w-full bg-blue-100 border-2 border-blue-400 rounded-lg p-4 my-8">
                                    <span className="text-base font-medium text-gray-700">Owner Name:</span>
                                    <span className="ml-2 text-gray-900 font-semibold text-base">{Owner?.name || ""}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {ownerInfoFields.map((field, index) => {
                                        const IconComponent = field.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-purple-100 p-4 rounded-xl border border-purple-300 shadow-lg"
                                            >
                                                <p className="text-sm text-gray-600 mb-2 capitalize flex items-center gap-1.5">
                                                    <IconComponent className="text-lg text-purple-600" />
                                                    {field.label}
                                                </p>
                                                <p className="text-base font-bold text-gray-900">{field.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Medical History Tab */}
                        {activeTab === 'medical-history' && (
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    Vaccinations
                                </h2>
                                <div className="mb-4">
                                    {(!vaccinations ||  vaccinations.length === 0) &&
                                        (
                                            <div className="text-center py-12">
                                                <p className="text-gray-500">No Vaccinations</p>
                                            </div>
                                        )
                                    }
                                    {vaccinations?.map((vaccination) => (
                                        <div
                                            key={vaccination.id}
                                            className="bg-purple-50 border-l-4 text-purple-600 p-4 mb-5 rounded-lg flex justify-between items-center"
                                        >
                                            <div className="flex-1">
                                                <p className="text-base font-bold text-gray-900 mb-1">
                                                    {vaccination.vaccination_name}
                                                </p>
                                                <div className="flex flex-col text-sm text-gray-600">
                                                    <div className="flex flex-nowrap mb-1">
                                                        <FaSyringe size={15} className="mr-2 text-purple-600" />
                                                        <span>{vaccination.dose_type}</span>
                                                    </div>
                                                    <div className="flex flex-nowrap">
                                                        <FaCalendarAlt size={15} className="mr-2 text-purple-600" />
                                                        <span>{formatDate(vaccination.date_vaccinated)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <MdCheckCircle className="text-2xl text-cyan-500 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full bg-purple-200 text-purple-600 cursor-pointer py-3 rounded-xl font-semibold mb-8 hover:bg-purple-300 transition-colors flex items-center justify-center gap-2"
                                        onClick={handleAddVaccination}>
                                    <FaPlus /> Add New
                                </button>
                                <PopupModel open={isAddVaccinationPopupOpen} onCancel={handleVaccinationPopupCancel} onPrimary={handleVaccinationPopupPrimaryAction} primaryLabel="Add">
                                    <form className="w-full max-w-lg bg-white rounded-xl px-8 py-10 shadow-lg">
                                        <h2 className="text-base font-bold mb-8 text-center">Enter Vaccination Details</h2>
                                        <div className="mb-3 text-sm">
                                            <label htmlFor="vaccination_name" className="block font-semibold mb-1">Vaccination Name *</label>
                                            <input
                                                type="text"
                                                id="vaccination_name"
                                                name="vaccination_name"
                                                value={newVaccinationRecord?.vaccination_name || ""}
                                                onChange={handleNewVaccinationRecordChange}
                                                required
                                                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                                            />
                                        </div>
                                        <div className="mb-3 text-sm">
                                            <label htmlFor="date_vaccinated" className="block font-semibold mb-1">Date of vaccination *</label>
                                            <input
                                                type="date"
                                                id="date_vaccinated"
                                                name="date_vaccinated"
                                                value={newVaccinationRecord?.date_vaccinated || ""}
                                                onChange={handleNewVaccinationRecordChange}
                                                max={today.toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                                            />
                                        </div>
                                        <div className="mb-3 text-sm">
                                            <label htmlFor="dose_type" className="block font-semibold mb-1">Dose type *</label>
                                            <input
                                                type="text"
                                                id="dose_type"
                                                name="dose_type"
                                                value={newVaccinationRecord?.dose_type || ""}
                                                onChange={handleNewVaccinationRecordChange}
                                                placeholder="Annual"
                                                required
                                                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none"
                                            />
                                        </div>
                                    </form>
                                </PopupModel>

                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    Prescriptions
                                </h2>
                                <div className="grid grid-cols-6 gap-3">
                                    {prescriptions?.map((prescription) => (
                                        <div
                                            key={prescription.id}
                                            className="aspect-square bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform flex items-center justify-center relative"
                                            onClick={handleViewPrescription(prescription)}>
                                            <img className="object-cover" alt={`Prescription ${prescription.id}`} src="/images/customer/prescription.png"/>
                                        </div>
                                    ))}
                                    <div className="aspect-square bg-purple-200 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform text-3xl"
                                    onClick={handleAddPrescription}>
                                        <FaPlus className="text-purple-600" />
                                    </div>
                                    <PopupModel open={isAddPrescriptionPopupOpen} onCancel={handlePrescriptionPopupCancel} onPrimary={handlePrescriptionPopupPrimaryAction} primaryLabel="Add">
                                        <form className="space-y-6 mb-4">
                                            <h2 className="text-base font-bold mb-8 text-center">Enter Prescription Details</h2>
                                            {/* Appointment Dropdown */}
                                             <div>
                                                <label htmlFor="appointment_id" className="block text-sm font-medium text-[#134252] mb-2">
                                                    Select Appointment <span className="text-[#c0152f]">*</span>
                                                </label>
                                                <select
                                                    id="appointment_id"
                                                    name="appointment_id"
                                                    value={newPrescriptionRecord?.appointment_id || ""}
                                                    onChange={handleNewPrescriptionRecordChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#2180a1] focus:ring-2 focus:ring-[#2180a1]/10 transition-colors"
                                                >
                                                    <option value="">-- Choose an option --</option>
                                                    {pastAppointments.map((apt) => (
                                                        <option key={apt.appointment_id} value={apt.appointment_id}>
                                                            {formatDate(apt.date)} - {apt.start_time} to {apt.end_time}
                                                        </option>
                                                    ))}
                                                    <option value="direct">Direct / Offline Consultation (No appointment)</option>
                                                </select>
                                                <p className="text-xs text-[#626c7c] mt-1">Select a past appointment or Direct Consultation</p>

                                                {pastAppointments.length === 0 && (
                                                    <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-700 flex items-start gap-2">
                                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                                        <span>No past appointments found. You can select "Direct / Offline Consultation" to upload a prescription directly.</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Notes/Prescription Text */}
                                            <div>
                                                <label  htmlFor="text" className="block text-sm font-medium text-[#134252] mb-2">
                                                    Notes / Prescription Text <span className="text-[#c0152f]">*</span>
                                                </label>
                                                <textarea
                                                    id="text"
                                                    name="text"
                                                    value={newPrescriptionRecord?.text || ""}
                                                    onChange={handleNewPrescriptionRecordChange}
                                                    placeholder="Enter prescription notes, dosage, instructions..."
                                                    required
                                                    rows={5}
                                                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#2180a1] focus:ring-2 focus:ring-[#2180a1]/10 transition-colors resize-none"
                                                />
                                                <p className="text-xs text-[#626c7c] mt-1">Provide detailed prescription information</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Prescription File</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => setNewPrescriptionRecord({...newPrescriptionRecord, file: e.target.files ? e.target.files[0] : null})}
                                                    className="w-full border rounded-lg px-3 py-2 bg-white"
                                                />
                                            </div>
                                        </form>
                                    </PopupModel>
                                </div>
                            </div>
                        )}

                        {/* Timeline Tab */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Complete Treatment Timeline</h2>
                                {timelineLoading ? (
                                    <div className="py-8 text-center"><p className="text-gray-500">Loading timeline...</p></div>
                                ) : fullTimeline.length === 0 ? (
                                    <div className="py-8 text-center"><p className="text-gray-500">No timeline history available.</p></div>
                                ) : (
                                    <div className="relative border-l-2 border-pink-200 ml-4 space-y-8">
                                        {fullTimeline.map((item, idx) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className="absolute w-4 h-4 bg-pink-500 rounded-full -left-[9px] top-1 border-4 border-white shadow-sm" />
                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-gray-800 text-sm">{item.date} at {item.start_time}</h3>
                                                            <p className="text-xs text-gray-500">{item.visit_type?.toUpperCase()} • {item.status?.toUpperCase()}</p>
                                                        </div>
                                                        <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                                                            {item.vet_name}
                                                        </span>
                                                    </div>
                                                    {item.reason && <p className="text-sm text-gray-700 mt-2 font-medium">Reason: <span className="font-normal">{item.reason}</span></p>}
                                                    {item.notes && <p className="text-sm text-gray-600 mt-1 italic">Notes: {item.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {loading && <LoadingState fullScreen message="Loading..." />}
        </>
    );
}
