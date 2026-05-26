"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api/config";
import {
  FaDog,
  FaVenusMars,
  FaWeightHanging,
  FaIdBadge,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSyringe,
  FaPlus,
} from "react-icons/fa";
import { CheckCircle } from "lucide-react";

interface AppointmentDetail {
  id: number;
  pet_name?: string;
  petName?: string;
  breed?: string;
  age?: string;
  weight?: string;
  visit_type?: string;
  gender?: string;
  license_number?: string;
  owner_name?: string;
  owner?: string;
  contact_number?: string;
  contact?: string;
  address?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  pet_image?: string;
  medical_history?: Array<{
    vaccine_name?: string;
    vaccine_type?: string;
    date_administered?: string;
    dose?: string;
  }>;
  prescriptions?: Array<{
    id: number;
    image_url?: string;
    document_url?: string;
  }>;
  [key: string]: any; // Allow any additional API fields
}

type TabType = "details" | "info" | "history";

interface AppointmentDetailsProps {
  appointmentId: number;
}

export default function AppointmentDetails({ appointmentId }: AppointmentDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use centralized API_BASE

  // Get auth token
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("petneo_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      null
    );
  };

  // Fetch appointment details from API
  const fetchAppointmentDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!API_BASE) {
        throw new Error("API base URL not configured");
      }

      const requestUrl = `${API_BASE}/appointments/${appointmentId}`;
      console.log(`[AppointmentDetails Component] Fetching URL: ${requestUrl}`);
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`[AppointmentDetails Component] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch appointment details: ${response.status}`);
      }

      const data = await response.json();
      setAppointment(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  const tabs: TabType[] = ["details", "info", "history"];

  // Helper functions to safely get data with fallbacks
  const getPetName = () => appointment?.pet_name || appointment?.petName || "Unknown Pet";
  const getBreed = () => appointment?.breed || "Unknown Breed";
  const getAge = () => appointment?.age || "Unknown Age";
  const getWeight = () => appointment?.weight || "Unknown Weight";
  const getGender = () => appointment?.gender || "Unknown";
  const getLicense = () => appointment?.license_number || "Not provided";
  const getOwner = () => appointment?.owner_name || appointment?.owner || "Unknown Owner";
  const getContact = () => appointment?.contact_number || appointment?.contact || "Not provided";
  const getAddress = () => appointment?.address || "Not provided";
  const getVisitType = () => appointment?.visit_type || "Regular Check-up";
  const getAppointmentDate = () => appointment?.appointment_date || "Date not set";
  const getAppointmentTime = () => appointment?.appointment_time || "Time not set";
  const getPetImage = () => appointment?.pet_image || "/images/pet-placeholder.jpg";

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen py-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button 
            onClick={fetchAppointmentDetails}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen py-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Appointment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors"
        >
          ← Back
        </button>
        {/* Pet Info Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={getPetImage()}
            alt="pet"
            className="w-28 h-28 rounded-full object-cover border-4 border-pink-400 shadow-md"
            onError={(e) => {
              e.currentTarget.src = "/images/pet-placeholder.jpg";
            }}
          />
          <h2 className="mt-4 text-3xl font-bold text-black">
            {getPetName()}
          </h2>
          <p className="text-lg text-black/70 font-medium">
            {getBreed()} | {getAge()}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mt-8 bg-pink-100 rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-5 py-3 rounded-full text-base font-semibold transition ${
                activeTab === tab
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md"
                  : "text-black/70"
              }`}
            >
              {tab === "details" && "Appointment Details"}
              {tab === "info" && "Pet Information"}
              {tab === "history" && "Medical History"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* Appointment Details */}
          {activeTab === "details" && (
            <div className="p-6 bg-pink-200 text-black rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold">{formatDate(getAppointmentDate())}</h3>
              <p className="text-lg font-semibold">{getAppointmentTime()}</p>
              <p className="text-base mt-2 font-semibold">{getVisitType()}</p>
              <p className="text-sm mt-1">Status: {appointment.status || "Scheduled"}</p>
              <button className="mt-4 px-4 py-2 bg-white text-pink-600 font-semibold text-sm rounded-full">
                Consultation
              </button>
            </div>
          )}

          {/* Pet Information */}
          {activeTab === "info" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <FaDog className="text-pink-500" />,
                  label: `Species: ${appointment.species || "Dog"}`,
                },
                {
                  icon: <FaDog className="text-pink-500" />,
                  label: `Breed: ${getBreed()}`,
                },
                {
                  icon: <FaVenusMars className="text-pink-500" />,
                  label: `Gender: ${getGender()}`,
                },
                {
                  icon: <FaIdBadge className="text-pink-500" />,
                  label: `Age: ${getAge()}`,
                },
                {
                  icon: <FaWeightHanging className="text-pink-500" />,
                  label: `Weight: ${getWeight()}`,
                },
                {
                  icon: <FaIdBadge className="text-pink-500" />,
                  label: `License: ${getLicense()}`,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-white shadow-md rounded-lg flex items-center gap-3 text-black text-lg font-medium"
                >
                  {item.icon} <span>{item.label}</span>
                </div>
              ))}

              <div className="col-span-2 p-4 bg-white shadow-md rounded-lg text-lg text-black">
                <span className="font-semibold">Owner:</span> {getOwner()}
              </div>
              <div className="p-4 bg-white shadow-md rounded-lg flex items-center gap-3 text-lg text-black">
                <FaPhone className="text-pink-500" /> <span>{getContact()}</span>
              </div>
              <div className="p-4 bg-white shadow-md rounded-lg flex items-center gap-3 text-lg text-black">
                <FaMapMarkerAlt className="text-pink-500" /> <span>{getAddress()}</span>
              </div>
            </div>
          )}

          {/* Medical History */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Vaccine Cards */}
              {appointment.medical_history && appointment.medical_history.length > 0 ? (
                appointment.medical_history.map((vaccine, i) => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-xl shadow-md flex justify-between items-center"
                  >
                    <div>
                      <h4 className="text-xl font-semibold text-black">
                        {vaccine.vaccine_name || "Vaccine"}
                      </h4>
                      <p className="text-base text-black/80 flex items-center gap-2 mt-2">
                        <FaSyringe className="text-pink-500" /> 
                        {vaccine.vaccine_type || vaccine.dose || "Booster dose"}
                      </p>
                      <p className="text-base text-black/80 flex items-center gap-2 mt-1">
                        <FaCalendarAlt className="text-pink-500" /> 
                        {vaccine.date_administered ? formatDate(vaccine.date_administered) : "Date not available"}
                      </p>
                    </div>
                    <CheckCircle className="text-pink-500 w-7 h-7" />
                  </div>
                ))
              ) : (
                <div className="bg-white p-5 rounded-xl shadow-md text-center text-gray-500">
                  No medical history available
                </div>
              )}

              {/* Add New Vaccine */}
              <button className="w-full flex items-center justify-center gap-2 bg-pink-100 text-pink-600 rounded-lg py-4 hover:bg-pink-200 transition text-lg font-semibold">
                <FaPlus /> Add New Vaccine
              </button>

              {/* Prescriptions */}
              <div>
                <h4 className="text-xl font-semibold mb-3 text-black">
                  Prescriptions
                </h4>
                <div className="flex gap-3 bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                  {appointment.prescriptions && appointment.prescriptions.length > 0 ? (
                    appointment.prescriptions.map((prescription) => (
                      <img
                        key={prescription.id}
                        src={prescription.image_url || prescription.document_url || "/prescription-placeholder.png"}
                        alt="prescription"
                        className="w-28 h-28 rounded-lg border object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/prescription-placeholder.png";
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-gray-500 text-center w-full py-8">
                      No prescriptions available
                    </div>
                  )}
                  <button className="w-28 h-28 flex items-center justify-center border-2 border-dashed border-pink-400 rounded-lg text-pink-500 hover:bg-pink-50">
                    <FaPlus size={22} />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl shadow-lg hover:opacity-90 transition text-lg font-semibold">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
