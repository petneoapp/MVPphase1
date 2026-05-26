import {FaCalendarAlt, FaClock, FaPlus, FaSyringe} from "react-icons/fa";
import {HiOutlineDocumentText} from "react-icons/hi";
import React, {useEffect, useRef, useState} from "react";
import {api} from "@/utils/api";
import FullScreenLoader from "./fullScreenLoader";
import PopupModel from "./popupModel";
import {ErrorBanner} from "../common/ErrorBanner";
import {ErrorAlert} from "@/utils/commonTypes";
import {removeItemById} from "@/utils/common";

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

    const handleViewPrescription = (prescription: Prescription) => {
        return () => {
            window.open(prescription.prescription_file_url);
        };
    };

    const [activeTab, setActiveTab] = useState<'visit-details' | 'medical-history'>(
        'visit-details'
    );

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
                    {/* visit Details Tab */}
                    {activeTab === 'visit-details' && (
                        <div>
                            {(!visitHistory ||  visitHistory.length === 0) &&
                                (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No Visit History</p>
                                    </div>
                                )
                            }
                            {visitHistory?.map((appointment) => (
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

                    {/* Medical History Tab */}
                    {activeTab === 'medical-history' && (
                        <div className="min-h-screen bg-[#eaeaff] flex flex-col items-center py-8">
                            <div className="w-full max-w-md">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-md font-semibold">Vaccinations</h2>
                                </div>
                                <div className="bg-white rounded-2xl shadow divide-y divide-gray-200 mb-4">
                                    {vaccinations.length > 0 ?
                                        vaccinations.map((vaccine) => (
                                            <div key={vaccine.id} className="flex items-center justify-between px-4 py-4">
                                                <div>
                                                    <div className="text-sm font-bold">{vaccine.vaccination_name}</div>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                        <FaSyringe size={15} className="mr-2" />
                                                        <span className="mt-1">{vaccine.dose_type}</span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <FaCalendarAlt size={15} className="mr-2" />
                                                        <span className="mt-1">{vaccine.date_vaccinated}</span>
                                                    </div>
                                                </div>
                                                <HiOutlineDocumentText className="text-gray-700 mr-8" size={50} />
                                            </div>
                                        )) :
                                        <div className="flex items-center justify-items-center grid grid-cols-1 min-h-30">
                                            <span>No Vaccination Data</span>
                                        </div>}
                                </div>
                                <button className="w-full flex items-center justify-center bg-pink-500 text-white py-4 rounded-xl text-md font-medium mt-8 hover:bg-pink-600"
                                        onClick={handleAddDocuments}>
                                    <FaPlus />
                                    Add Documents
                                </button>
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
                                <div className="flex items-center justify-between mt-15 mb-2">
                                    <h2 className="text-md font-semibold">Prescriptions/ Medical Reports</h2>
                                </div>
                                <div className="bg-white rounded-2xl shadow divide-y divide-gray-200 mb-4">
                                    {prescriptions.length > 0 ?
                                        prescriptions.map((prescription) => (
                                            <div key={prescription.id} className="flex items-center justify-between px-4 py-4">
                                                <div>
                                                    <div className="flex-col items-center text-xs text-gray-500 mt-1">
                                                        <img alt="prescription image" src="/images/customer/prescription.png"/>
                                                        <span className="mt-1">{prescription.created_at}</span>
                                                    </div>
                                                </div>
                                                <button className="w-[8vw] bg-pink-500 text-white py-4 rounded-xl text-md font-medium hover:bg-pink-600"
                                                        onClick={handleViewPrescription(prescription)}>
                                                    View
                                                </button>
                                            </div>
                                        )) :
                                        <div className="flex items-center justify-items-center grid grid-cols-1 min-h-30">
                                            <span>No Prescription Data</span>
                                        </div>}
                                </div>
                            </div>
                            <FullScreenLoader loading={loading}/>
                        </div>
                    )}
                </div>
            </div>
        </>

    );
}
