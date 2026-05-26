"use client";

import React, { useEffect, useState, useRef } from "react";
import { Poppins } from "next/font/google";
import { api } from "@/utils/api";
import { FaUserCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

type APIVet = {
    vet_id?: number;
    first_name?: string;
    last_name?: string;
    emergency?: boolean;
    profile_picture_url?: string | null;
};

export default function PartnerWorkStatusPage(): React.JSX.Element {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<APIVet | null>(null);
    const [emergency, setEmergency] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string, ms = 3000) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), ms);
    };

    const hasFetched = useRef(false);
    useEffect(() => {
        (async () => {
            if (!hasFetched.current) {
                try {
                    hasFetched.current = true;
                    setLoading(true);
                    const data = (await api.get("/vet/myBio", undefined, "partner")) as APIVet;
                    setProfile(data);
                    setEmergency(!!data.emergency);
                } catch (e: any) {
                    console.error("Fetch profile error:", e);
                    showToast("error", "Failed to fetch work status info");
                } finally {
                    setLoading(false);
                }
            }
        })();
    }, []);

    const toggleEmergency = async () => {
        const newValue = !emergency;
        setEmergency(newValue); // Optimistic update
        setSaving(true);
        try {
            await api.put("/vet/updateEmergency", { emergency: newValue }, "partner");
            showToast("success", `Emergency status updated to ${newValue ? "ON" : "OFF"}`);
        } catch (e: any) {
            console.error("Update emergency error:", e);
            setEmergency(!newValue); // Revert on failure
            showToast("error", e?.message || "Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-blue-50 flex items-center justify-center ${poppins.className}`}>
                <div className="animate-pulse space-y-4 w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
                        toast.type === "success" ? "bg-green-600" : "bg-red-600"
                    }`}
                    role="status"
                >
                    {toast.text}
                </div>
            )}

            <div className={`min-h-screen bg-blue-50 p-6 md:p-10 ${poppins.className}`}>
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">Work Status</h1>
                        <span className="text-sm text-gray-500 font-medium">Settings &gt; Work Status</span>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
                        {/* Profile Info */}
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-pink-100">
                                {profile?.profile_picture_url ? (
                                    <img
                                        src={profile.profile_picture_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <FaUserCircle className="text-gray-400 w-full h-full" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Dr. {profile?.first_name} {profile?.last_name}
                                </h2>
                                <p className="text-sm text-gray-500">Veterinary Partner</p>
                            </div>
                        </div>

                        {/* Status Pills */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <FaCheckCircle className="text-green-500 text-2xl mb-2" />
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Regular Hours</span>
                                <span className="text-sm font-medium text-green-800 mt-1">Active (Per Slots)</span>
                            </div>
                            <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                                emergency 
                                    ? "bg-pink-50 border-pink-100 text-pink-700" 
                                    : "bg-gray-50 border-gray-100 text-gray-400"
                            }`}>
                                <FaExclamationTriangle className={`text-2xl mb-2 ${emergency ? "text-pink-500 animate-pulse" : ""}`} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Emergency Mode</span>
                                <span className={`text-sm font-medium mt-1 ${emergency ? "text-pink-800" : ""}`}>
                                    {emergency ? "ON (24/7 Available)" : "OFF"}
                                </span>
                            </div>
                        </div>

                        {/* Emergency Toggle Container */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                            <div className="space-y-1 pr-4">
                                <h3 className="font-semibold text-gray-900">Emergency Bookings</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    When enabled, pet owners will be able to contact you for urgent care even outside your standard schedule slots.
                                </p>
                            </div>
                            {/* Toggle Switch */}
                            <button
                                onClick={toggleEmergency}
                                disabled={saving}
                                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    emergency ? "bg-[#d14d91]" : "bg-gray-200"
                                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        emergency ? "translate-x-6" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
