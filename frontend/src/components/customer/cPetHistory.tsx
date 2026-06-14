import {FaPlus} from "react-icons/fa";
import React, {useEffect, useRef, useState} from "react";
import {api} from "@/utils/api";
import { LoadingState } from "@/components/common/LoadingState";
import PopupModel from "./popupModel";
import { AlertBanner } from "@/components/common/AlertBanner";
import { ErrorAlert } from "@/utils/commonTypes";
import { removeItemById } from "@/utils/common";
import { TimelineView, TimelineEvent } from "@/components/common/TimelineView";

interface C_PetHistoryProps {
    petId: number;
}

interface Vaccination {
    id: number;
    vaccination_name: string;
    date_vaccinated: string;
    dose_type: string;
}

interface NewVaccination {
    pet_id?: number;
    vaccination_name?: string;
    date_vaccinated?: string;
    dose_type?: string;
}

interface Prescription {
    id: number;
    appointment_id: number;
    text: string;
    prescription_file_url: string;
    created_at: string;
}

interface VisitHistoryDetails {
    appointment_id: number;
    date: string;
    start_time: string;
    end_time: string;
    reason: string | null;
    status: 'booked' | 'completed' | 'cancelled' | 'no-show';
    visit_type: 'in-clinic' | 'tele' | 'in-home';
    notes?: string | null;
}

export default function C_PetHistory({petId} : C_PetHistoryProps) {

    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [visitHistory, setVisitHistory] = useState<VisitHistoryDetails[]>([]);
    const [errors, setErrors] = useState<ErrorAlert[]>([]);
    const handleDismiss = (id: string) => {
        setErrors(curr => curr.filter(e => e.id !== id));
    };

    const hasFetched = useRef(false);
    const [loading, setLoading] = useState<boolean>(false);
    const fetchAndAssignVaccinationsList = () => {
        if (petId > 0) {
            //fetching the pet details
            setLoading(true);
            setErrors(removeItemById(errors, "get-my-pet-history-api"));
            const petDetailsResponse = api.get(`/pets/user/${petId}`);
            Promise.all([petDetailsResponse]).then(([res1]) => {
                if (res1?.vaccinations && Array.isArray(res1.vaccinations)) {
                    const vaccinationsLocal: Vaccination[] = [];
                    res1.vaccinations.forEach((item: Vaccination) => {
                        vaccinationsLocal.push(item);
                    });

                    //setting the vaccinations
                    setVaccinations(vaccinationsLocal);

                }

                if (res1?.prescriptions && Array.isArray(res1.prescriptions)) {
                    const prescriptionsLocal: Prescription[] = [];
                    res1.prescriptions.forEach((item: Prescription) => {
                        prescriptionsLocal.push(item);
                    });

                    //setting the vaccinations
                    setPrescriptions(prescriptionsLocal);

                }

                if (res1?.visit_history && Array.isArray(res1.visit_history)) {
                    const visit_historyLocal: VisitHistoryDetails[] = [];
                    res1.visit_history.forEach((item: VisitHistoryDetails) => {
                        visit_historyLocal.push(item);
                    });

                    //setting the visit history
                    setVisitHistory(visit_historyLocal);

                }
                setLoading(false);
            }).catch((error) => {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'get-my-pet-history-api',
                        title: `API Error while getting your pet's medical history details`,
                        message: error.message || 'Unknown error'
                    }
                ]);
                setLoading(false);
            });
        }
    };
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchAndAssignVaccinationsList();
        }
    }, []);

    const today = new Date();

    const [newVaccinationRecord, setNewVaccinationRecord] = useState<NewVaccination>({});
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    useEffect(() => {
        if(isPopupOpen) {
            setNewVaccinationRecord({pet_id: petId});
        } else {
            setNewVaccinationRecord({});
        }
    }, [isPopupOpen]);
    const handleAddDocuments = () => {
        setIsPopupOpen(true);
    };
    const handlePopupCancel = () => {
        setIsPopupOpen(false);
    };
    const handlePrimaryAction = async () => {
        if (newVaccinationRecord?.pet_id && newVaccinationRecord?.date_vaccinated &&
            newVaccinationRecord?.vaccination_name && newVaccinationRecord?.dose_type) {
            const formData = new FormData();
            formData.append("pet_id", newVaccinationRecord.pet_id.toString());
            formData.append("date_vaccinated", newVaccinationRecord.date_vaccinated);
            formData.append("vaccination_name", newVaccinationRecord.vaccination_name);
            formData.append("dose_type", newVaccinationRecord.dose_type);
            try {
                //send the details to backend and close the popup.
                setLoading(true);
                setErrors(removeItemById(errors, "add-vaccination-api"));
                const createVaccinationRecordResponse = await api.formDatapost("/pets/user/addVaccination", formData);

                if (createVaccinationRecordResponse?.success) {
                    //refreshing the vaccinations list
                    fetchAndAssignVaccinationsList();
                }
            } catch (error: any) {
                setErrors(curr => [
                    ...curr,
                    {
                        id: 'add-vaccination-api',
                        title: `API Error while adding the vaccination details for your pet`,
                        message: error.message || 'Unknown error'
                    }
                ]);
            } finally {
                setLoading(false);
                setIsPopupOpen(false);
            }



        } else {
            alert("Please provide all the details");
        }
    };
    const handleNewVaccinationRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewVaccinationRecord({
            ...newVaccinationRecord,
            [e.target.name]: e.target.value
        });
    };


    const [activeTab, setActiveTab] = useState<'visit-details' | 'medical-history'>(
        'visit-details'
    );

    const visitEvents: TimelineEvent[] = visitHistory.map(app => ({
        id: app.appointment_id.toString(),
        title: app.visit_type === 'in-clinic' ? 'Clinic Consultation' : app.visit_type === 'tele' ? 'Online Consultation' : 'Home Visit',
        description: app.notes ? `${app.reason || 'No specific reason provided.'}\n\nNotes: ${app.notes}` : app.reason || 'No specific reason provided.',
        timestamp: `${app.date} ${app.start_time} - ${app.end_time}`,
        status: app.status === 'completed' ? 'success' : app.status === 'cancelled' ? 'danger' : 'info'
    }));

    const medicalEvents: TimelineEvent[] = [
        ...vaccinations.map(v => ({
            id: `vac-${v.id}`,
            title: v.vaccination_name,
            description: `Dose: ${v.dose_type}`,
            timestamp: v.date_vaccinated,
            status: 'success' as const
        })),
        ...prescriptions.map(p => ({
            id: `presc-${p.id}`,
            title: 'Prescription Uploaded',
            description: p.text || 'No description',
            timestamp: p.created_at,
            status: 'info' as const,
            attachments: [{ name: 'View Document', url: p.prescription_file_url }]
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


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
            
            <div className="max-w-2xl mx-auto mt-8">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 justify-center flex-wrap">
                    {[
                        { id: 'visit-details', label: 'Visit Details' },
                        { id: 'medical-history', label: 'Medical History' },
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
                
                <div className="transition-opacity duration-300">
                    {activeTab === 'visit-details' && (
                        <div className="bg-white rounded-2xl shadow p-6">
                            <h2 className="text-lg font-semibold mb-6">Recent Visits</h2>
                            <TimelineView events={visitEvents} />
                        </div>
                    )}

                    {activeTab === 'medical-history' && (
                        <div className="min-h-screen flex flex-col items-center">
                            <div className="w-full">
                                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold">Medical Timeline</h2>
                                        <button className="flex items-center justify-center bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600"
                                                onClick={handleAddDocuments}>
                                            <FaPlus className="mr-2" />
                                            Add Record
                                        </button>
                                    </div>
                                    <TimelineView events={medicalEvents} />
                                </div>
                                
                                <PopupModel open={isPopupOpen} onCancel={handlePopupCancel} onPrimary={handlePrimaryAction} primaryLabel="Save">
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {loading && <LoadingState fullScreen message="Loading pet history..." />}
        </>
    );
}
